import { createClient } from "@supabase/supabase-js";

// The publishable key is safe to ship in client code — it has no access on
// its own beyond what row-level security policies allow per signed-in user.
const SUPABASE_URL = "https://zvpoyrkjwjcvwzfnfrli.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_vwS0o3Lk7jsHiYMjmMFTMg_308oOsPv";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
