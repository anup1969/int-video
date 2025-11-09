-- Add password column to campaigns table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'password'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN password TEXT;
    RAISE NOTICE 'Password column added to campaigns table';
  ELSE
    RAISE NOTICE 'Password column already exists';
  END IF;
END $$;
