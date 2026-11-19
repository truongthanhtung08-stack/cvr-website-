// NỐI WEB → MINI APP: @/lib/supabase/client của web → CÙNG một phiên Supabase của Mini App (vào bằng Zalo).
import { supabase } from "../lib/supabase";
export function createClient() { return supabase; }
