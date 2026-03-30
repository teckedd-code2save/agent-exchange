-- Add richer service contract metadata for endpoint-level testing and lifecycle guidance
ALTER TABLE "Service"
ADD COLUMN IF NOT EXISTS "lifecycle" JSONB;
