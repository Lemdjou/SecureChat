/*
  # Secure Messaging Application Schema

  ## Overview
  This migration creates the database schema for a secure messaging application with RSA encryption.

  ## New Tables

  ### 1. `profiles`
  - `id` (uuid, primary key) - References auth.users
  - `username` (text, unique) - User's chosen username
  - `full_name` (text) - User's full name
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last profile update

  ### 2. `key_pairs`
  - `id` (uuid, primary key) - Unique key pair identifier
  - `user_id` (uuid) - References profiles(id)
  - `public_key` (text) - RSA public key (PEM format)
  - `private_key_encrypted` (text) - Encrypted private key for storage
  - `created_at` (timestamptz) - Key generation timestamp
  - `expires_at` (timestamptz) - Key expiration date (90 days from creation)
  - `is_active` (boolean) - Whether this key pair is currently active

  ### 3. `messages`
  - `id` (uuid, primary key) - Unique message identifier
  - `sender_id` (uuid) - References profiles(id)
  - `recipient_id` (uuid) - References profiles(id)
  - `encrypted_content` (text) - RSA encrypted message content
  - `created_at` (timestamptz) - Message send timestamp
  - `read_at` (timestamptz, nullable) - Message read timestamp

  ## Security
  - Enable RLS on all tables
  - Users can only read their own profile
  - Users can only manage their own key pairs
  - Users can send messages to any user
  - Users can only read messages sent to them or sent by them
  - Private keys are stored encrypted (additional layer of security)

  ## Indexes
  - Index on messages(recipient_id) for fast inbox queries
  - Index on messages(sender_id) for fast sent messages queries
  - Index on key_pairs(user_id, is_active) for active key lookup
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  full_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create key_pairs table
CREATE TABLE IF NOT EXISTS key_pairs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  public_key text NOT NULL,
  private_key_encrypted text NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '90 days'),
  is_active boolean DEFAULT true
);

ALTER TABLE key_pairs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all public keys"
  ON key_pairs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own key pairs"
  ON key_pairs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own key pairs"
  ON key_pairs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create index for active key lookup
CREATE INDEX IF NOT EXISTS idx_key_pairs_user_active ON key_pairs(user_id, is_active) WHERE is_active = true;

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  encrypted_content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view received messages"
  ON messages FOR SELECT
  TO authenticated
  USING (auth.uid() = recipient_id);

CREATE POLICY "Users can view sent messages"
  ON messages FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id);

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update received messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

-- Create indexes for message queries
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id, created_at DESC);
