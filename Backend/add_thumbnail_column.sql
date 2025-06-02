-- Migration script to add Thumbnail_URL column to Content table
-- Run this script in your MySQL database to add thumbnail support

-- Check if the column already exists and add it if it doesn't
SET @column_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'Content' 
    AND COLUMN_NAME = 'Thumbnail_URL'
);

-- Add the column if it doesn't exist
SET @sql = IF(@column_exists = 0, 
    'ALTER TABLE Content ADD COLUMN Thumbnail_URL VARCHAR(255) AFTER Featured_Image;',
    'SELECT "Thumbnail_URL column already exists" as message;'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verify the table structure
DESCRIBE Content;
