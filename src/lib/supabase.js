import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mbsfzxwzgqtxgldlktzp.supabase.co';
const supabaseAnonKey = 'sb_publishable_vH8l3jz7oi9N-OhZhuzaHQ_Vb7PPM97';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
