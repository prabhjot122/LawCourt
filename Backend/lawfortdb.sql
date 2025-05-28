-- =====================================================
-- LawFort Database Setup Script
-- =====================================================
--
-- DEFAULT ADMIN CREDENTIALS:
-- Email: admin@lawfort.com
-- Password: admin123
--
-- IMPORTANT SECURITY NOTES:
-- 1. Change the default admin password immediately after first login
-- 2. The password is hashed using bcrypt for security
-- 3. The admin account has full system privileges
--
-- =====================================================
-- SELECT user, host, authentication_string FROM mysql.user;
-- ALTER USER 'root'@'localhost' IDENTIFIED BY 'Sahil@123';
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'Sahil@123';
FLUSH PRIVILEGES;

CREATE DATABASE IF NOT EXISTS lawfort;

USE lawfort;

-- Drop stored procedures if they exist
DROP PROCEDURE IF EXISTS register_user;
DROP PROCEDURE IF EXISTS user_login;
DROP PROCEDURE IF EXISTS user_logout;
DROP PROCEDURE IF EXISTS admin_approve_deny_access;

-- Drop tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS OAuth_Providers;
DROP TABLE IF EXISTS Audit_Logs;
DROP TABLE IF EXISTS Session;
DROP TABLE IF EXISTS Content_Comments;
DROP TABLE IF EXISTS Content;
DROP TABLE IF EXISTS Access_Request;
DROP TABLE IF EXISTS User_Profile;
DROP TABLE IF EXISTS Permissions;
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Roles;

CREATE TABLE Roles (
    Role_ID INT AUTO_INCREMENT PRIMARY KEY,
    Role_Name VARCHAR(50) NOT NULL,  -- Super Admin, Admin, Editor, User
    Description TEXT
);

-- Insert default roles
INSERT INTO Roles (Role_ID, Role_Name, Description) VALUES
(1, 'Admin', 'System Administrator with full access'),
(2, 'Editor', 'Content Editor with content management access'),
(3, 'User', 'Regular User with standard access');

CREATE TABLE Users (
    User_ID INT AUTO_INCREMENT PRIMARY KEY,
    Email VARCHAR(100) NOT NULL UNIQUE,
    Password VARCHAR(255),  -- Store hashed passwords (nullable for OAuth users)
    Role_ID INT,
    Is_Super_Admin BOOLEAN DEFAULT FALSE,  -- Flag to indicate if the user is a super admin
    Status VARCHAR(20) DEFAULT 'Active',  -- User's status (Active, Inactive, Banned)
    Auth_Provider VARCHAR(20) DEFAULT 'local',  -- 'local', 'google', etc.
    OAuth_ID VARCHAR(255),  -- OAuth provider user ID
    Profile_Complete BOOLEAN DEFAULT TRUE,  -- Track if OAuth user completed profile
    Created_At DATETIME DEFAULT CURRENT_TIMESTAMP,
    Updated_At DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Role_ID) REFERENCES Roles(Role_ID),
    UNIQUE KEY unique_oauth (Auth_Provider, OAuth_ID)
);
CREATE TABLE Permissions (
    Permission_ID INT AUTO_INCREMENT PRIMARY KEY,
    Role_ID INT,
    Permission_Name VARCHAR(100),
    Permission_Description TEXT,
    FOREIGN KEY (Role_ID) REFERENCES Roles(Role_ID)
);
CREATE TABLE User_Profile (
    Profile_ID INT AUTO_INCREMENT PRIMARY KEY,
    User_ID INT,
    Full_Name VARCHAR(255),
    Phone VARCHAR(15),
    Bio TEXT,
    Profile_Pic VARCHAR(255),
    Law_Specialization VARCHAR(100),
    Education VARCHAR(255),
    Bar_Exam_Status ENUM('Passed', 'Pending', 'Not Applicable'),
    License_Number VARCHAR(100),
    Practice_Area VARCHAR(255),
    Location VARCHAR(255),
    Years_of_Experience INT,
    LinkedIn_Profile VARCHAR(255),
    Alumni_of VARCHAR(255),
    Professional_Organizations TEXT,
    FOREIGN KEY (User_ID) REFERENCES Users(User_ID)
);
CREATE TABLE Access_Request (
    Request_ID INT AUTO_INCREMENT PRIMARY KEY,
    User_ID INT,  -- User requesting editor access
    Requested_At DATETIME DEFAULT CURRENT_TIMESTAMP,
    Status ENUM('Pending', 'Approved', 'Denied') DEFAULT 'Pending',
    Approved_At DATETIME,
    Denied_At DATETIME,
    Admin_ID INT, -- Admin who approves/denies the request
    FOREIGN KEY (User_ID) REFERENCES Users(User_ID),
    FOREIGN KEY (Admin_ID) REFERENCES Users(User_ID)
);
CREATE TABLE Content (
    Content_ID INT AUTO_INCREMENT PRIMARY KEY,
    User_ID INT,
    Content_Type VARCHAR(50), -- Post, Research Paper, Comment, etc.
    Title VARCHAR(255),
    Content TEXT,
    Created_At DATETIME DEFAULT CURRENT_TIMESTAMP,
    Updated_At DATETIME DEFAULT CURRENT_TIMESTAMP,
    Status VARCHAR(20) DEFAULT 'Active',  -- Active, Inactive, Deleted
    FOREIGN KEY (User_ID) REFERENCES Users(User_ID)
);
CREATE TABLE Content_Comments (
    Comment_ID INT AUTO_INCREMENT PRIMARY KEY,
    Content_ID INT,
    User_ID INT,
    Comment_Content TEXT,
    Created_At DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Content_ID) REFERENCES Content(Content_ID),
    FOREIGN KEY (User_ID) REFERENCES Users(User_ID)
);
CREATE TABLE Session (
    Session_ID INT AUTO_INCREMENT PRIMARY KEY,
    User_ID INT,
    Session_Token VARCHAR(255),  -- Unique token for each session
    Last_Active_Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (User_ID) REFERENCES Users(User_ID)
);
CREATE TABLE Audit_Logs (
    Log_ID INT AUTO_INCREMENT PRIMARY KEY,
    Admin_ID INT,
    Action_Type VARCHAR(255),
    Action_Details TEXT,
    Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Admin_ID) REFERENCES Users(User_ID)
);

CREATE TABLE OAuth_Providers (
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


DELIMITER //

CREATE PROCEDURE register_user(
    IN p_email VARCHAR(100),
    IN p_password VARCHAR(255),
    IN p_full_name VARCHAR(255),
    IN p_phone VARCHAR(15),
    IN p_bio TEXT,
    IN p_profile_pic VARCHAR(255),
    IN p_law_specialization VARCHAR(100),
    IN p_education VARCHAR(255),
    IN p_bar_exam_status ENUM('Passed', 'Pending', 'Not Applicable'),
    IN p_license_number VARCHAR(100),
    IN p_practice_area VARCHAR(255),
    IN p_location VARCHAR(255),
    IN p_years_of_experience INT,
    IN p_linkedin_profile VARCHAR(255),
    IN p_alumni_of VARCHAR(255),
    IN p_professional_organizations TEXT
)
BEGIN
    DECLARE new_user_id INT;

    -- Insert user into Users table
    INSERT INTO Users (Email, Password, Role_ID, Status)
    VALUES (p_email, p_password, 3, 'Active');

    -- Get the User_ID of the newly created user
    SET new_user_id = LAST_INSERT_ID();

    -- Insert user profile into User_Profile table
    INSERT INTO User_Profile (User_ID, Full_Name, Phone, Bio, Profile_Pic, Law_Specialization,
                            Education, Bar_Exam_Status, License_Number, Practice_Area,
                            Location, Years_of_Experience, LinkedIn_Profile, Alumni_of,
                            Professional_Organizations)
    VALUES (new_user_id, p_full_name, p_phone, p_bio, p_profile_pic, p_law_specialization,
            p_education, p_bar_exam_status, p_license_number, p_practice_area,
            p_location, p_years_of_experience, p_linkedin_profile, p_alumni_of,
            p_professional_organizations);

    SELECT 'Registration successful.' AS message;
END //

DELIMITER ;
DELIMITER //

CREATE PROCEDURE user_login(
    IN p_email VARCHAR(100),
    IN p_password VARCHAR(255)
)
BEGIN
    DECLARE user_id INT;
    DECLARE role_id INT;
    DECLARE is_super_admin BOOLEAN;
    DECLARE session_token VARCHAR(255);

    -- Check if the user exists and password matches
    SELECT User_ID, Role_ID, Is_Super_Admin INTO user_id, role_id, is_super_admin
    FROM Users WHERE Email = p_email AND Password = p_password;

    IF user_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid credentials';
    ELSE
        -- Create a new session
        SET session_token = UUID();

        INSERT INTO Session (User_ID, Session_Token, Last_Active_Timestamp)
        VALUES (user_id, session_token, NOW());

        SELECT 'Login successful' AS message, session_token;
    END IF;
END //

DELIMITER ;
DELIMITER //

CREATE PROCEDURE user_logout(
    IN p_session_token VARCHAR(255)
)
BEGIN
    DELETE FROM Session WHERE Session_Token = p_session_token;

    SELECT 'Logout successful' AS message;
END //

DELIMITER ;
DELIMITER //

CREATE PROCEDURE admin_approve_deny_access(
    IN p_request_id INT,
    IN p_action ENUM('Approve', 'Deny'),
    IN p_admin_id INT
)
BEGIN
    DECLARE user_id INT;
    DECLARE current_status ENUM('Pending', 'Approved', 'Denied');

    -- Get the request details
    SELECT User_ID, Status INTO user_id, current_status
    FROM Access_Request WHERE Request_ID = p_request_id;

    IF current_status != 'Pending' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'This request has already been processed.';
    ELSE
        IF p_action = 'Approve' THEN
            UPDATE Access_Request
            SET Status = 'Approved', Approved_At = CURRENT_TIMESTAMP, Admin_ID = p_admin_id
            WHERE Request_ID = p_request_id;

            -- Update the user's role to Editor
            UPDATE Users SET Role_ID = 2 WHERE User_ID = user_id;

            -- Log the admin action in Audit Logs
            INSERT INTO Audit_Logs (Admin_ID, Action_Type, Action_Details)
            VALUES (p_admin_id, 'Approve Editor Access', CONCAT('Approved editor access for user ', user_id));

            SELECT 'Editor access granted.' AS message;
        ELSEIF p_action = 'Deny' THEN
            UPDATE Access_Request
            SET Status = 'Denied', Denied_At = CURRENT_TIMESTAMP, Admin_ID = p_admin_id
            WHERE Request_ID = p_request_id;

            -- Log the admin action in Audit Logs
            INSERT INTO Audit_Logs (Admin_ID, Action_Type, Action_Details)
            VALUES (p_admin_id, 'Deny Editor Access', CONCAT('Denied editor access for user ', user_id));

            SELECT 'Editor access denied.' AS message;
        END IF;
    END IF;
END //

DELIMITER ;

-- Insert default admin user with bcrypt hashed password
INSERT INTO Users (Email, Password, Role_ID, Is_Super_Admin, Status) VALUES
('admin@lawfort.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RX.PZa2u2', 1, TRUE, 'Active');
USE lawfort;
-- Reset admin password to 'admin123' with a known bcrypt hash
UPDATE Users SET Password = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RX.PZa2u2' WHERE Email = 'admin@lawfort.com';
-- Get the admin user ID and insert profile
SET @admin_user_id = LAST_INSERT_ID();

INSERT INTO User_Profile (User_ID, Full_Name, Phone, Bio, Profile_Pic, Law_Specialization,
                        Education, Bar_Exam_Status, License_Number, Practice_Area, Location,
                        Years_of_Experience, LinkedIn_Profile, Alumni_of, Professional_Organizations)
VALUES (@admin_user_id, 'System Administrator', '+1-555-0123',
        'Default system administrator account with full access',
        '', 'Legal Technology & Administration', 'J.D.', 'Passed', 'ADMIN001',
        'System Administration', 'New York, NY', 5, '', '', 'American Bar Association');

-- Insert sample editor user for testing
-- Password: editor123 (hashed with bcrypt)
INSERT INTO Users (Email, Password, Role_ID, Status) VALUES
('editor@lawfort.com', '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 2, 'Active');

-- Get the editor user ID and insert profile
SET @editor_user_id = LAST_INSERT_ID();

INSERT INTO User_Profile (User_ID, Full_Name, Phone, Bio, Profile_Pic, Law_Specialization,
                        Education, Bar_Exam_Status, License_Number, Practice_Area, Location,
                        Years_of_Experience, LinkedIn_Profile, Alumni_of, Professional_Organizations)
VALUES (@editor_user_id, 'Content Editor', '+1-555-0124',
        'Content editor specializing in legal publications and research materials',
        '', 'Legal Publishing', 'J.D., Yale Law School', 'Passed', 'EDIT001',
        'Content Management', 'Boston, MA', 7, 'https://linkedin.com/in/editor',
        'Yale Law School, Class of 2017', 'American Bar Association, Legal Writers Association');


