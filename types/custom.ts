import { Database } from "./supabase";

export type Community = Database["public"]["Tables"]["community"]["Row"]