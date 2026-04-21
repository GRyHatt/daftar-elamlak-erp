import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yfgbontepetwoebrseww.supabase.co';
const supabaseAnonKey = 'sb_publishable_7C4vhA_KIJCvDgSw9hj-xw_5kiHIqY8';

// السطر ده هو اللي الإيرور بيدور عليه!
export const supabase = createClient(supabaseUrl, supabaseAnonKey);