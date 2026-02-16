import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://xfprwyojsobfvygqogrx.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmcHJ3eW9qc29iZnZ5Z3FvZ3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMTczMTgsImV4cCI6MjA4NjU5MzMxOH0.AlkVkZVGvm8YHms9UU1LeSvNYZpUylKa_9Kh8TVk3Wc";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
