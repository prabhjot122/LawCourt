-- Migration script to add OAuth and Email functionality to existing LawFort database
-- Run this script if you have an existing database

USE LawFort;

-- Add OAuth columns to Users table if they don't exist
ALTER TABLE Users
ADD COLUMN IF NOT EXISTS Auth_Provider VARCHAR(20) DEFAULT 'local',
ADD COLUMN IF NOT EXISTS OAuth_ID VARCHAR(255),
ADD COLUMN IF NOT EXISTS Profile_Complete BOOLEAN DEFAULT TRUE;

-- Add unique constraint for OAuth if it doesn't exist
ALTER TABLE Users
ADD CONSTRAINT unique_oauth UNIQUE (Auth_Provider, OAuth_ID);

-- Create OAuth_Providers table if it doesn't exist
CREATE TABLE IF NOT EXISTS OAuth_Providers (
    Provider_ID INT AUTO_INCREMENT PRIMARY KEY,
    User_ID INT,
    Provider_Name VARCHAR(50) NOT NULL,  -- 'google', 'facebook', etc.
    Provider_User_ID VARCHAR(255) NOT NULL,  -- OAuth provider's user ID
    Access_Token TEXT,  -- OAuth access token (encrypted)
    Refresh_Token TEXT,  -- OAuth refresh token (encrypted)
    Token_Expires_At DATETIME,
    Created_At DATETIME DEFAULT CURRENT_TIMESTAMP,
    Updated_At DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (User_ID) REFERENCES Users(User_ID),
    UNIQUE KEY unique_provider_user (Provider_Name, Provider_User_ID)
);

-- Email functionality removed - no longer creating Email_Logs table

-- Update existing users to have Profile_Complete = TRUE for local auth users
UPDATE Users SET Profile_Complete = TRUE WHERE Auth_Provider = 'local' OR Auth_Provider IS NULL;

-- Show tables to verify migration
SHOW TABLES;

-- Show Users table structure to verify columns
DESCRIBE Users;

-- Show new tables structure
DESCRIBE OAuth_Providers;
DESCRIBE Email_Logs;

SELECT 'Migration completed successfully!' as Status;
