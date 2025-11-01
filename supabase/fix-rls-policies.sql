-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read campaigns" ON campaigns;
DROP POLICY IF EXISTS "Allow public insert campaigns" ON campaigns;
DROP POLICY IF EXISTS "Allow public update campaigns" ON campaigns;
DROP POLICY IF EXISTS "Allow public delete campaigns" ON campaigns;

DROP POLICY IF EXISTS "Allow public read steps" ON steps;
DROP POLICY IF EXISTS "Allow public insert steps" ON steps;
DROP POLICY IF EXISTS "Allow public update steps" ON steps;
DROP POLICY IF EXISTS "Allow public delete steps" ON steps;

DROP POLICY IF EXISTS "Allow public read connections" ON connections;
DROP POLICY IF EXISTS "Allow public insert connections" ON connections;
DROP POLICY IF EXISTS "Allow public update connections" ON connections;
DROP POLICY IF EXISTS "Allow public delete connections" ON connections;

DROP POLICY IF EXISTS "Allow public read responses" ON responses;
DROP POLICY IF EXISTS "Allow public insert responses" ON responses;
DROP POLICY IF EXISTS "Allow public update responses" ON responses;
DROP POLICY IF EXISTS "Allow public delete responses" ON responses;

-- Create new policies for campaigns
CREATE POLICY "Allow public read campaigns"
ON campaigns FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow public insert campaigns"
ON campaigns FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Allow public update campaigns"
ON campaigns FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public delete campaigns"
ON campaigns FOR DELETE
TO public
USING (true);

-- Create policies for steps
CREATE POLICY "Allow public read steps"
ON steps FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow public insert steps"
ON steps FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Allow public update steps"
ON steps FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public delete steps"
ON steps FOR DELETE
TO public
USING (true);

-- Create policies for connections
CREATE POLICY "Allow public read connections"
ON connections FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow public insert connections"
ON connections FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Allow public update connections"
ON connections FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public delete connections"
ON connections FOR DELETE
TO public
USING (true);

-- Create policies for responses
CREATE POLICY "Allow public read responses"
ON responses FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow public insert responses"
ON responses FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Allow public update responses"
ON responses FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public delete responses"
ON responses FOR DELETE
TO public
USING (true);
