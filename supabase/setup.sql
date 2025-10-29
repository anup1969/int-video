-- ============================================
-- SUPABASE DATABASE SETUP
-- Interactive Video Campaign Builder
-- ============================================
-- Run this file in Supabase SQL Editor
-- Or run migrations individually in order (001, 002, 003)
-- ============================================

-- ============================================
-- 1. CREATE CAMPAIGNS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL DEFAULT 'Untitled Campaign',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS campaigns_status_idx ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS campaigns_created_at_idx ON public.campaigns(created_at DESC);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to campaigns"
    ON public.campaigns
    FOR ALL
    USING (true)
    WITH CHECK (true);

COMMENT ON TABLE public.campaigns IS 'Stores interactive video campaigns/flows';

-- ============================================
-- 2. CREATE UPDATED_AT TRIGGER FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_campaigns
    BEFORE UPDATE ON public.campaigns
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 3. CREATE STEPS TABLE
-- ============================================

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

    UNIQUE (campaign_id, step_number)
);

CREATE INDEX IF NOT EXISTS steps_campaign_id_idx ON public.steps(campaign_id);
CREATE INDEX IF NOT EXISTS steps_step_number_idx ON public.steps(campaign_id, step_number);
CREATE INDEX IF NOT EXISTS steps_created_at_idx ON public.steps(created_at DESC);

ALTER TABLE public.steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to steps"
    ON public.steps
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE TRIGGER set_updated_at_steps
    BEFORE UPDATE ON public.steps
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

COMMENT ON TABLE public.steps IS 'Stores individual video steps within campaigns';

-- ============================================
-- 4. CREATE CONNECTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    from_step_id TEXT NOT NULL,
    to_step_id UUID NOT NULL REFERENCES public.steps(id) ON DELETE CASCADE,
    connection_type TEXT NOT NULL DEFAULT 'default' CHECK (connection_type IN ('default', 'logic')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS connections_campaign_id_idx ON public.connections(campaign_id);
CREATE INDEX IF NOT EXISTS connections_from_step_idx ON public.connections(from_step_id);
CREATE INDEX IF NOT EXISTS connections_to_step_idx ON public.connections(to_step_id);

ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to connections"
    ON public.connections
    FOR ALL
    USING (true)
    WITH CHECK (true);

COMMENT ON TABLE public.connections IS 'Stores visual connections between steps in the flow builder';

-- ============================================
-- 5. CREATE HELPER FUNCTIONS
-- ============================================

-- Function to get campaign with all steps and connections
CREATE OR REPLACE FUNCTION public.get_campaign_full(campaign_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'campaign', row_to_json(c.*),
        'steps', COALESCE(
            (SELECT json_agg(row_to_json(s.*) ORDER BY s.step_number)
             FROM public.steps s
             WHERE s.campaign_id = campaign_uuid),
            '[]'::json
        ),
        'connections', COALESCE(
            (SELECT json_agg(row_to_json(conn.*))
             FROM public.connections conn
             WHERE conn.campaign_id = campaign_uuid),
            '[]'::json
        )
    ) INTO result
    FROM public.campaigns c
    WHERE c.id = campaign_uuid;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- You can now use the database with your application
-- ============================================
