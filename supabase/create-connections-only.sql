-- Create ONLY the connections table
-- Run this if you already have campaigns and steps tables

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
