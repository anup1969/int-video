-- Create templates table
CREATE TABLE IF NOT EXISTS public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('lead-generation', 'product-feedback', 'customer-survey', 'faq', 'support', 'training')),
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  thumbnail TEXT,
  is_system BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on category for faster filtering
CREATE INDEX IF NOT EXISTS idx_templates_category ON public.templates(category);

-- Create index on user_id for user's custom templates
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON public.templates(user_id);

-- Create index on is_system to quickly get system templates
CREATE INDEX IF NOT EXISTS idx_templates_is_system ON public.templates(is_system);

-- Enable Row Level Security
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view system templates
CREATE POLICY "Anyone can view system templates" ON public.templates
  FOR SELECT
  USING (is_system = true);

-- Policy: Users can view their own custom templates
CREATE POLICY "Users can view own templates" ON public.templates
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create their own templates
CREATE POLICY "Users can create templates" ON public.templates
  FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_system = false);

-- Policy: Users can update their own templates
CREATE POLICY "Users can update own templates" ON public.templates
  FOR UPDATE
  USING (auth.uid() = user_id AND is_system = false);

-- Policy: Users can delete their own templates
CREATE POLICY "Users can delete own templates" ON public.templates
  FOR DELETE
  USING (auth.uid() = user_id AND is_system = false);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON public.templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
