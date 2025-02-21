"use client";

import { create } from "zustand";
import { createClient } from "@/utils/supabase/client";

interface ReputationEntry {
  id: number;
  user_id: string;
  changed_by?: string | null;
  change_value: number;
  reason?: string | null;
  changed_at: string | null;
}

interface ReputationStore {
  reputationHistory: ReputationEntry[];
  loading: boolean;
  error: string | null;
  fetchReputationHistory: () => Promise<void>;
  fetchUserReputationHistory: (userId: string) => Promise<void>;
  addReputationEntry: (entry: Omit<ReputationEntry, "id" | "changed_at">) => Promise<void>;
}

export const useReputationStore = create<ReputationStore>((set, get) => ({
  reputationHistory: [],
  loading: false,
  error: null,

  // Fetch all reputation history records
  fetchReputationHistory: async () => {
    set({ loading: true, error: null });
    const supabase = createClient();

    try {
      const { data, error } = await supabase.from("reputation_history").select("*").order("changed_at", { ascending: false });

      if (error) throw error;

      set({ reputationHistory: data, error: null });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  // Fetch reputation history for a specific user
  fetchUserReputationHistory: async (userId) => {
    set({ loading: true, error: null });
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from("reputation_history")
        .select("*")
        .eq("user_id", userId)
        .order("changed_at", { ascending: false });

      if (error) throw error;

      set({ reputationHistory: data, error: null });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  // Add a new reputation entry and update the user's reputation
  addReputationEntry: async (entry) => {
    set({ loading: true, error: null });
    const supabase = createClient();

    try {
      // Insert new reputation history record
      const { data, error } = await supabase.from("reputation_history").insert([entry]).select("*").single();
      if (error) throw error;

      // Fetch current reputation of the user
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("reputation")
        .eq("id", entry.user_id)
        .single();

      if (userError) throw userError;

      const newReputation = (userData?.reputation || 0) + entry.change_value;

      // Update user's reputation
      const { error: updateError } = await supabase
        .from("users")
        .update({ reputation: newReputation })
        .eq("id", entry.user_id);

      if (updateError) throw updateError;

      set({ reputationHistory: [data, ...get().reputationHistory], error: null });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },
}));
