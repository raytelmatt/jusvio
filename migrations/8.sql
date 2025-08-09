
-- Update column names to be more generic for cloud storage
ALTER TABLE documents ADD COLUMN cloud_file_id TEXT;
ALTER TABLE documents ADD COLUMN cloud_web_url TEXT;

-- Copy OneDrive data to new generic columns
UPDATE documents SET cloud_file_id = onedrive_file_id WHERE onedrive_file_id IS NOT NULL;
UPDATE documents SET cloud_web_url = onedrive_web_url WHERE onedrive_web_url IS NOT NULL;
