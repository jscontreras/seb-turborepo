-- This is a reference for the required environment variables
-- Add these to your Vercel project settings:

-- BLOB_READ_WRITE_TOKEN (automatically provided by Vercel Blob)

-- No database setup required - using only Vercel Blob for storage and metadata
SELECT 'Environment variables needed:' as message;
SELECT 'BLOB_READ_WRITE_TOKEN' as variable, 'Vercel Blob token (auto-provided)' as description;
SELECT 'All audio metadata is stored with the blob files' as note;
