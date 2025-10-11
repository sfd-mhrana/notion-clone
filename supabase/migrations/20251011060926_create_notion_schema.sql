/*
  # Create Notion Clone Schema

  1. New Tables
    - `pages`
      - `id` (uuid, primary key)
      - `title` (text, default 'Untitled')
      - `icon` (text, nullable - emoji or icon identifier)
      - `cover_image` (text, nullable - URL to cover image)
      - `parent_id` (uuid, nullable - for nested pages)
      - `position` (integer, default 0 - for ordering)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `blocks`
      - `id` (uuid, primary key)
      - `page_id` (uuid, foreign key to pages)
      - `type` (text - heading1, heading2, heading3, text, list, checklist, quote)
      - `content` (text - the actual content)
      - `position` (integer, default 0 - for ordering within page)
      - `properties` (jsonb, nullable - for additional block-specific properties)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for public access (since this is a demo app)
    - Policies allow anyone to read, insert, update, and delete
*/

-- Create pages table
CREATE TABLE IF NOT EXISTS pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text DEFAULT 'Untitled' NOT NULL,
  icon text,
  cover_image text,
  parent_id uuid REFERENCES pages(id) ON DELETE CASCADE,
  position integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create blocks table
CREATE TABLE IF NOT EXISTS blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid REFERENCES pages(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('heading1', 'heading2', 'heading3', 'text', 'bulletlist', 'numberlist', 'checklist', 'quote')),
  content text DEFAULT '' NOT NULL,
  position integer DEFAULT 0 NOT NULL,
  properties jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_pages_parent_id ON pages(parent_id);
CREATE INDEX IF NOT EXISTS idx_pages_position ON pages(position);
CREATE INDEX IF NOT EXISTS idx_blocks_page_id ON blocks(page_id);
CREATE INDEX IF NOT EXISTS idx_blocks_position ON blocks(position);

-- Enable Row Level Security
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

-- Create policies for pages (public access for demo)
CREATE POLICY "Anyone can view pages"
  ON pages FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert pages"
  ON pages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update pages"
  ON pages FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete pages"
  ON pages FOR DELETE
  USING (true);

-- Create policies for blocks (public access for demo)
CREATE POLICY "Anyone can view blocks"
  ON blocks FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert blocks"
  ON blocks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update blocks"
  ON blocks FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete blocks"
  ON blocks FOR DELETE
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_pages_updated_at ON pages;
CREATE TRIGGER update_pages_updated_at
  BEFORE UPDATE ON pages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_blocks_updated_at ON blocks;
CREATE TRIGGER update_blocks_updated_at
  BEFORE UPDATE ON blocks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
