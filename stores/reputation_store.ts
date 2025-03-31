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
  currentEntry: ReputationEntry | null;
  loading: boolean;
  error: string | null;

  // CRUD Operations
  // Create
  createReputationEntry: (
    entry: Omit<ReputationEntry, "id" | "changed_at">
  ) => Promise<ReputationEntry | null>;

  // Read Operations
  fetchReputationEntries: (filters?: {
    user_id?: string;
    changed_by?: string;
    min_value?: number;
    max_value?: number;
  }) => Promise<void>;

  fetchReputationEntryById: (id: number) => Promise<void>;

  // Update Operations
  updateReputationEntry: (
    id: number,
    updates: Partial<Omit<ReputationEntry, "id">>
  ) => Promise<ReputationEntry | null>;

  // Delete Operations
  deleteReputationEntry: (id: number) => Promise<boolean>;
  
  // Bulk Operations
  bulkCreateReputationEntries: (
    entries: Array<Omit<ReputationEntry, "id" | "changed_at">>
  ) => Promise<ReputationEntry[]>;

  bulkDeleteReputationEntries: (ids: number[]) => Promise<number>;

  // Utility Methods
  clearCurrentEntry: () => void;
  resetError: () => void;
}

export const useReputationStore = create<ReputationStore>((set, get) => ({
  reputationHistory: [],
  currentEntry: null,
  loading: false,
  error: null,

  // Create a single reputation entry
  createReputationEntry: async (entry) => {
    set({ loading: true, error: null });
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from("reputation_history")
        .insert(entry)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      set({
        reputationHistory: [data, ...get().reputationHistory],
        currentEntry: data,
        error: null,
      });

      return data;
    } catch (error) {
      const errorMessage = (error as Error).message;
      set({ error: errorMessage });
      return null;
    } finally {
      set({ loading: false });
    }
  },

  // Fetch reputation entries with flexible filtering
  fetchReputationEntries: async (filters = {}) => {
    set({ loading: true, error: null });
    const supabase = createClient();

    try {
      // Start with base query
      let query = supabase.from("reputation_history").select("*");

      // Apply filters
      if (filters.user_id) {
        query = query.eq("user_id", filters.user_id);
      }
      if (filters.changed_by) {
        query = query.eq("changed_by", filters.changed_by);
      }
      if (filters.min_value !== undefined) {
        query = query.gte("change_value", filters.min_value);
      }
      if (filters.max_value !== undefined) {
        query = query.lte("change_value", filters.max_value);
      }

      // Add ordering
      query = query.order("changed_at", { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      set({ 
        reputationHistory: data || [],
        error: null 
      });
    } catch (error) {
      set({ 
        error: (error as Error).message,
        reputationHistory: [] 
      });
    } finally {
      set({ loading: false });
    }
  },

  // Fetch a specific reputation entry by ID
  fetchReputationEntryById: async (id) => {
    set({ loading: true, error: null });
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from("reputation_history")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      set({ 
        currentEntry: data,
        error: null 
      });
    } catch (error) {
      set({ 
        error: (error as Error).message,
        currentEntry: null 
      });
    } finally {
      set({ loading: false });
    }
  },

  // Update a reputation entry
  updateReputationEntry: async (id, updates) => {
    set({ loading: true, error: null });
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from("reputation_history")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Update in local state
      set({
        reputationHistory: get().reputationHistory.map(entry => 
          entry.id === id ? data : entry
        ),
        currentEntry: data,
        error: null
      });

      return data;
    } catch (error) {
      set({ error: (error as Error).message });
      return null;
    } finally {
      set({ loading: false });
    }
  },

  // Delete a single reputation entry
  deleteReputationEntry: async (id) => {
    set({ loading: true, error: null });
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from("reputation_history")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Remove from local state
      set({
        reputationHistory: get().reputationHistory.filter(entry => entry.id !== id),
        currentEntry: null,
        error: null
      });

      return true;
    } catch (error) {
      set({ error: (error as Error).message });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  // Bulk create reputation entries
  bulkCreateReputationEntries: async (entries) => {
    set({ loading: true, error: null });
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from("reputation_history")
        .insert(entries)
        .select();

      if (error) throw error;

      // Update local state
      set({
        reputationHistory: [...data, ...get().reputationHistory],
        error: null
      });

      return data;
    } catch (error) {
      set({ error: (error as Error).message });
      return [];
    } finally {
      set({ loading: false });
    }
  },

  // Bulk delete reputation entries
  bulkDeleteReputationEntries: async (ids) => {
    set({ loading: true, error: null });
    const supabase = createClient();

    try {
      const { count, error } = await supabase
        .from("reputation_history")
        .delete()
        .in("id", ids);

      if (error) throw error;

      // Remove from local state
      set({
        reputationHistory: get().reputationHistory.filter(
          entry => !ids.includes(entry.id)
        ),
        error: null
      });

      return count || 0;
    } catch (error) {
      set({ error: (error as Error).message });
      return 0;
    } finally {
      set({ loading: false });
    }
  },

  // Utility method to clear current entry
  clearCurrentEntry: () => {
    set({ currentEntry: null });
  },

  // Utility method to reset error
  resetError: () => {
    set({ error: null });
  },
}));