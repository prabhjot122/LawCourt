-- Script to remove email functionality from existing LawFort database
-- Run this script to drop Email_Logs table and clean up email-related data

USE LawFort;

-- Drop Email_Logs table if it exists
DROP TABLE IF EXISTS Email_Logs;

-- Remove any email-related stored procedures if they exist
-- (Currently none exist, but this is for future-proofing)

-- Display confirmation
SELECT 'Email functionality successfully removed from database' AS message;
