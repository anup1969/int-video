-- Create connections table
-- This stores visual connections between steps for the flow builder

CREATE TABLE IF NOT EXISTS public.connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    from_step_id TEXT NOT NULL, -- Can be 'start' or UUID of step
    to_step_id UUID NOT NULL REFERENCES public.steps(id) ON DELETE CASCADE,
    connection_type TEXT NOT NULL DEFAULT 'default' CHECK (connection_type IN ('default', 'logic')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS connections_campaign_id_idx ON public.connections(campaign_id);
CREATE INDEX IF NOT EXISTS connections_from_step_idx ON public.connections(from_step_id);
CREATE INDEX IF NOT EXISTS connections_to_step_idx ON public.connections(to_step_id);

-- Enable Row Level Security
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public access (for now - will add auth in Phase 3)
CREATE POLICY "Allow public access to connections"
    ON public.connections
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Add comment
COMMENT ON TABLE public.connections IS 'Stores visual connections between steps in the flow builder';
