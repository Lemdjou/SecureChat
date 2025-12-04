import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  username: string;
  full_name: string;
  created_at: string;
  updated_at: string;
};

export type KeyPair = {
  id: string;
  user_id: string;
  public_key: string;
  private_key_encrypted: string;
  created_at: string;
  expires_at: string;
  is_active: boolean;
};

export type Message = {
  id: string;
  sender_id: string;
  recipient_id: string;
  encrypted_content: string;
  created_at: string;
  read_at: string | null;
};
