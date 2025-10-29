-- Create steps table
-- This stores individual video steps within campaigns

CREATE TABLE IF NOT EXISTS public.steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    label TEXT NOT NULL DEFAULT 'Untitled Step',
    position JSONB NOT NULL DEFAULT '{"x": 0, "y": 0}',
    answer_type TEXT NOT NULL DEFAULT 'open-ended' CHECK (
        answer_type IN ('open-ended', 'multiple-choice', 'button', 'calendar', 'file-upload', 'nps', 'contact-form')
    ),
    video_url TEXT,
    video_thumbnail TEXT,
    video_placeholder TEXT DEFAULT '🎬',

    -- Answer type specific configurations
    mc_options JSONB DEFAULT '[]',
    button_options JSONB DEFAULT '[]',
    enabled_response_types JSONB DEFAULT '{"video": true, "audio": true, "text": true}',

    -- Contact form configuration
    show_contact_form BOOLEAN DEFAULT false,
    contact_form_fields JSONB DEFAULT '[]',

    -- Logic rules
    logic_rules JSONB DEFAULT '[]',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Ensure unique step numbers within campaign
    UNIQUE (campaign_id, step_number)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS steps_campaign_id_idx ON public.steps(campaign_id);
CREATE INDEX IF NOT EXISTS steps_step_number_idx ON public.steps(campaign_id, step_number);
CREATE INDEX IF NOT EXISTS steps_created_at_idx ON public.steps(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.steps ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public access (for now - will add auth in Phase 3)
CREATE POLICY "Allow public access to steps"
    ON public.steps
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Add updated_at trigger
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.steps
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Add comment
COMMENT ON TABLE public.steps IS 'Stores individual video steps within campaigns';
