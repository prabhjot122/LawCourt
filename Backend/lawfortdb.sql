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

CREATE DATABASE IF NOT EXISTS lawfort;

USE lawfort;

-- Drop stored procedures if they exist
DROP PROCEDURE IF EXISTS register_user;
DROP PROCEDURE IF EXISTS user_login;
DROP PROCEDURE IF EXISTS user_logout;
DROP PROCEDURE IF EXISTS admin_approve_deny_access;
DROP PROCEDURE IF EXISTS create_blog_post;
DROP PROCEDURE IF EXISTS create_research_paper;
DROP PROCEDURE IF EXISTS create_note;
DROP PROCEDURE IF EXISTS create_course;
DROP PROCEDURE IF EXISTS create_job;
DROP PROCEDURE IF EXISTS create_internship;
DROP PROCEDURE IF EXISTS apply_for_job;
DROP PROCEDURE IF EXISTS apply_for_internship;
DROP PROCEDURE IF EXISTS update_content_status;
DROP PROCEDURE IF EXISTS add_comment;
DROP PROCEDURE IF EXISTS get_content_metrics;

-- Drop tables if they exist (in reverse order of dependencies)
-- First disable foreign key checks to avoid constraint issues
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS User_Library_Content;
DROP TABLE IF EXISTS User_Library_Folders;
DROP TABLE IF EXISTS Research_Paper_Reviews;
DROP TABLE IF EXISTS User_Saved_Content;
DROP TABLE IF EXISTS OAuth_Providers;
DROP TABLE IF EXISTS Content_Metrics;
DROP TABLE IF EXISTS Audit_Logs;
DROP TABLE IF EXISTS Session;
DROP TABLE IF EXISTS Content_Comments;
DROP TABLE IF EXISTS Job_Applications;
DROP TABLE IF EXISTS Internship_Applications;
DROP TABLE IF EXISTS Jobs;
DROP TABLE IF EXISTS Internships;
DROP TABLE IF EXISTS Available_Courses;
DROP TABLE IF EXISTS Notes;
DROP TABLE IF EXISTS Research_Papers;
DROP TABLE IF EXISTS Blog_Posts;
DROP TABLE IF EXISTS Content;
DROP TABLE IF EXISTS Access_Request;
DROP TABLE IF EXISTS User_Profile;
DROP TABLE IF EXISTS Permissions;
DROP TABLE IF EXISTS Notifications;
DROP TABLE IF EXISTS Email_Logs;
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Roles;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

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

-- Insert hierarchical permissions for each role
INSERT INTO Permissions (Role_ID, Permission_Name, Permission_Description) VALUES
-- Admin permissions (full access to everything)
(1, 'content_create_all', 'Create all types of content'),
(1, 'content_read_all', 'Read all content including private'),
(1, 'content_update_all', 'Update any content'),
(1, 'content_delete_all', 'Delete any content'),
(1, 'content_moderate', 'Moderate and ban content'),
(1, 'content_publish', 'Publish/unpublish any content'),
(1, 'user_manage', 'Manage user accounts and roles'),
(1, 'editor_manage', 'Manage editor accounts'),
(1, 'metrics_view_all', 'View all content metrics'),
(1, 'research_review', 'Review and approve research papers'),
(1, 'job_manage', 'Manage job and internship postings'),
(1, 'system_admin', 'Full system administration'),
(1, 'content_save', 'Save/bookmark content to personal library'),
(1, 'content_copy', 'Copy content for personal use'),
(1, 'research_submit', 'Submit research papers for review'),
(1, 'blog_comment', 'Comment on blog posts'),
(1, 'job_apply', 'Apply for jobs'),
(1, 'internship_apply', 'Apply for internships'),

-- Editor permissions (content creation and own content management)
(2, 'content_create_own', 'Create own content'),
(2, 'content_read_public', 'Read all public content'),
(2, 'content_update_own', 'Update own content'),
(2, 'content_delete_own', 'Delete own content'),
(2, 'content_publish_own', 'Publish own content'),
(2, 'metrics_view_own', 'View metrics for own content'),
(2, 'research_review', 'Review and approve research papers'),
(2, 'job_create', 'Create job and internship postings'),
(2, 'blog_comment', 'Comment on blog posts'),
(2, 'content_save', 'Save/bookmark content to personal library'),
(2, 'content_copy', 'Copy content for personal use'),
(2, 'research_submit', 'Submit research papers for review'),
(2, 'job_apply', 'Apply for jobs'),
(2, 'internship_apply', 'Apply for internships'),

-- User permissions (read-only + apply functionality + content saving)
(3, 'content_read_public', 'Read all public content'),
(3, 'blog_comment', 'Comment on blog posts'),
(3, 'job_apply', 'Apply for jobs'),
(3, 'internship_apply', 'Apply for internships'),
(3, 'content_save', 'Save/bookmark content to personal library'),
(3, 'content_copy', 'Copy content for personal use'),
(3, 'research_submit', 'Submit research papers for review');
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
    Content_Type ENUM('Blog_Post', 'Research_Paper', 'Note', 'Course', 'Job', 'Internship'), -- Specific content types
    Title VARCHAR(255),
    Summary TEXT,
    Content TEXT,
    Featured_Image VARCHAR(255),
    Thumbnail_URL VARCHAR(255), -- For generated thumbnails (especially for PDFs)
    Tags VARCHAR(255),
    Created_At DATETIME DEFAULT CURRENT_TIMESTAMP,
    Updated_At DATETIME DEFAULT CURRENT_TIMESTAMP,
    Status ENUM('Active', 'Inactive', 'Deleted', 'Banned', 'Restricted', 'Pending') DEFAULT 'Active',
    Is_Featured BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (User_ID) REFERENCES Users(User_ID)
);

-- Blog Posts table with specific fields for blog posts
CREATE TABLE Blog_Posts (
    Post_ID INT AUTO_INCREMENT PRIMARY KEY,
    Content_ID INT,
    Category VARCHAR(100),
    Allow_Comments BOOLEAN DEFAULT TRUE,
    Is_Published BOOLEAN DEFAULT FALSE,
    Publication_Date DATETIME,
    FOREIGN KEY (Content_ID) REFERENCES Content(Content_ID) ON DELETE CASCADE
);

-- Research Papers table with specific fields for research papers
CREATE TABLE Research_Papers (
    Paper_ID INT AUTO_INCREMENT PRIMARY KEY,
    Content_ID INT,
    Authors VARCHAR(255),
    Publication VARCHAR(255),
    Publication_Date DATE,
    DOI VARCHAR(100),
    Keywords VARCHAR(255),
    Abstract TEXT,
    Citation_Count INT DEFAULT 0,
    FOREIGN KEY (Content_ID) REFERENCES Content(Content_ID) ON DELETE CASCADE
);

-- Notes table with specific fields for notes
CREATE TABLE Notes (
    Note_ID INT AUTO_INCREMENT PRIMARY KEY,
    Content_ID INT,
    Category VARCHAR(100),
    Is_Private BOOLEAN DEFAULT FALSE,
    Content_Type ENUM('text', 'pdf') DEFAULT 'text',
    PDF_File_Path VARCHAR(255),
    PDF_File_Size INT,
    FOREIGN KEY (Content_ID) REFERENCES Content(Content_ID) ON DELETE CASCADE
);

-- Available Courses table with specific fields for courses
CREATE TABLE Available_Courses (
    Course_ID INT AUTO_INCREMENT PRIMARY KEY,
    Content_ID INT,
    Instructor VARCHAR(255),
    Duration VARCHAR(50),
    Start_Date DATE,
    End_Date DATE,
    Enrollment_Limit INT,
    Current_Enrollment INT DEFAULT 0,
    Prerequisites TEXT,
    Syllabus TEXT,
    FOREIGN KEY (Content_ID) REFERENCES Content(Content_ID) ON DELETE CASCADE
);

-- Jobs table with specific fields for job postings
CREATE TABLE Jobs (
    Job_ID INT AUTO_INCREMENT PRIMARY KEY,
    Content_ID INT,
    Company_Name VARCHAR(255),
    Location VARCHAR(255),
    Job_Type ENUM('Full-time', 'Part-time', 'Contract', 'Remote', 'Hybrid'),
    Salary_Range VARCHAR(100),
    Experience_Required VARCHAR(100),
    Eligibility_Criteria TEXT,
    Application_Deadline DATE,
    Contact_Email VARCHAR(255),
    Contact_Phone VARCHAR(50),
    Is_Featured BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (Content_ID) REFERENCES Content(Content_ID) ON DELETE CASCADE
);

-- Internships table with specific fields for internship postings
CREATE TABLE Internships (
    Internship_ID INT AUTO_INCREMENT PRIMARY KEY,
    Content_ID INT,
    Company_Name VARCHAR(255),
    Location VARCHAR(255),
    Internship_Type ENUM('Full-time', 'Part-time', 'Remote', 'Hybrid'),
    Stipend VARCHAR(100),
    Duration VARCHAR(100),
    Eligibility_Criteria TEXT,
    Application_Deadline DATE,
    Contact_Email VARCHAR(255),
    Contact_Phone VARCHAR(50),
    Is_Featured BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (Content_ID) REFERENCES Content(Content_ID) ON DELETE CASCADE
);

-- Job Applications table to track job applications
CREATE TABLE Job_Applications (
    Application_ID INT AUTO_INCREMENT PRIMARY KEY,
    Job_ID INT,
    User_ID INT,
    Resume_URL VARCHAR(255),
    Cover_Letter TEXT,
    Application_Date DATETIME DEFAULT CURRENT_TIMESTAMP,
    Status ENUM('Pending', 'Reviewed', 'Shortlisted', 'Rejected', 'Hired') DEFAULT 'Pending',
    Notes TEXT,
    FOREIGN KEY (Job_ID) REFERENCES Jobs(Job_ID) ON DELETE CASCADE,
    FOREIGN KEY (User_ID) REFERENCES Users(User_ID) ON DELETE CASCADE
);

-- Internship Applications table to track internship applications
CREATE TABLE Internship_Applications (
    Application_ID INT AUTO_INCREMENT PRIMARY KEY,
    Internship_ID INT,
    User_ID INT,
    Resume_URL VARCHAR(255),
    Cover_Letter TEXT,
    Application_Date DATETIME DEFAULT CURRENT_TIMESTAMP,
    Status ENUM('Pending', 'Reviewed', 'Shortlisted', 'Rejected', 'Selected') DEFAULT 'Pending',
    Notes TEXT,
    FOREIGN KEY (Internship_ID) REFERENCES Internships(Internship_ID) ON DELETE CASCADE,
    FOREIGN KEY (User_ID) REFERENCES Users(User_ID) ON DELETE CASCADE
);
CREATE TABLE Content_Comments (
    Comment_ID INT AUTO_INCREMENT PRIMARY KEY,
    Content_ID INT,
    User_ID INT,
    Comment_Content TEXT,
    Created_At DATETIME DEFAULT CURRENT_TIMESTAMP,
    Updated_At DATETIME DEFAULT CURRENT_TIMESTAMP,
    Status ENUM('Active', 'Hidden', 'Deleted') DEFAULT 'Active',
    Parent_Comment_ID INT DEFAULT NULL, -- For nested comments/replies
    FOREIGN KEY (Content_ID) REFERENCES Content(Content_ID) ON DELETE CASCADE,
    FOREIGN KEY (User_ID) REFERENCES Users(User_ID),
    FOREIGN KEY (Parent_Comment_ID) REFERENCES Content_Comments(Comment_ID) ON DELETE SET NULL
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

CREATE TABLE Content_Metrics (
    Metric_ID INT AUTO_INCREMENT PRIMARY KEY,
    Content_ID INT,
    Views INT DEFAULT 0,
    Likes INT DEFAULT 0,
    Shares INT DEFAULT 0,
    Comments_Count INT DEFAULT 0,
    Avg_Time_Spent INT DEFAULT 0, -- Average time spent in seconds
    Bounce_Rate DECIMAL(5,2) DEFAULT 0.00,
    Last_Updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Content_ID) REFERENCES Content(Content_ID) ON DELETE CASCADE
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

-- Table for user's saved/bookmarked content
CREATE TABLE User_Saved_Content (
    Save_ID INT AUTO_INCREMENT PRIMARY KEY,
    User_ID INT,
    Content_ID INT,
    Saved_At DATETIME DEFAULT CURRENT_TIMESTAMP,
    Notes TEXT,  -- Personal notes about the saved content
    FOREIGN KEY (User_ID) REFERENCES Users(User_ID),
    FOREIGN KEY (Content_ID) REFERENCES Content(Content_ID),
    UNIQUE KEY unique_user_content (User_ID, Content_ID)
);

-- Table for research paper review workflow
CREATE TABLE Research_Paper_Reviews (
    Review_ID INT AUTO_INCREMENT PRIMARY KEY,
    Content_ID INT,
    Reviewer_ID INT,  -- Editor or Admin who reviews
    Status ENUM('Pending', 'Under Review', 'Approved', 'Rejected', 'Needs Revision') DEFAULT 'Pending',
    Review_Comments TEXT,
    Submitted_At DATETIME DEFAULT CURRENT_TIMESTAMP,
    Reviewed_At DATETIME,
    FOREIGN KEY (Content_ID) REFERENCES Content(Content_ID),
    FOREIGN KEY (Reviewer_ID) REFERENCES Users(User_ID)
);

-- Table for user's personal library organization
CREATE TABLE User_Library_Folders (
    Folder_ID INT AUTO_INCREMENT PRIMARY KEY,
    User_ID INT,
    Folder_Name VARCHAR(255),
    Description TEXT,
    Created_At DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (User_ID) REFERENCES Users(User_ID)
);

-- Table to organize saved content into folders
CREATE TABLE User_Library_Content (
    Library_Content_ID INT AUTO_INCREMENT PRIMARY KEY,
    Save_ID INT,
    Folder_ID INT,
    Added_At DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Save_ID) REFERENCES User_Saved_Content(Save_ID),
    FOREIGN KEY (Folder_ID) REFERENCES User_Library_Folders(Folder_ID)
);

CREATE TABLE Email_Logs (
    Email_ID INT AUTO_INCREMENT PRIMARY KEY,
    Sender_ID INT,
    Recipient_Emails TEXT,  -- JSON array of recipient emails
    Subject VARCHAR(255),
    Content TEXT,
    Email_Type VARCHAR(50) DEFAULT 'notification',  -- 'notification', 'announcement', 'test'
    Status ENUM('sent', 'failed', 'pending') DEFAULT 'pending',
    Sent_At DATETIME DEFAULT CURRENT_TIMESTAMP,
    Error_Message TEXT,
    FOREIGN KEY (Sender_ID) REFERENCES Users(User_ID)
);

CREATE TABLE Notifications (
    Notification_ID INT AUTO_INCREMENT PRIMARY KEY,
    User_ID INT,
    Type VARCHAR(50) DEFAULT 'info',  -- 'info', 'success', 'warning', 'error', 'application'
    Title VARCHAR(255),
    Message TEXT,
    Is_Read BOOLEAN DEFAULT FALSE,
    Created_At DATETIME DEFAULT CURRENT_TIMESTAMP,
    Related_Content_ID INT,  -- Optional reference to related content
    Action_URL VARCHAR(255),  -- Optional action URL
    FOREIGN KEY (User_ID) REFERENCES Users(User_ID) ON DELETE CASCADE
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

DELIMITER //

CREATE PROCEDURE create_blog_post(
    IN p_user_id INT,
    IN p_title VARCHAR(255),
    IN p_summary TEXT,
    IN p_content TEXT,
    IN p_featured_image VARCHAR(255),
    IN p_tags VARCHAR(255),
    IN p_category VARCHAR(100),
    IN p_allow_comments BOOLEAN,
    IN p_is_published BOOLEAN
)
BEGIN
    DECLARE new_content_id INT;
    DECLARE user_role INT;

    -- Check if user has permission to create blog posts
    SELECT Role_ID INTO user_role FROM Users WHERE User_ID = p_user_id;

    IF user_role IN (1, 2) THEN -- Admin or Editor
        -- Insert into Content table
        INSERT INTO Content (User_ID, Content_Type, Title, Summary, Content, Featured_Image, Tags, Status)
        VALUES (p_user_id, 'Blog_Post', p_title, p_summary, p_content, p_featured_image, p_tags,
                CASE WHEN p_is_published THEN 'Active' ELSE 'Inactive' END);

        -- Get the Content_ID of the newly created content
        SET new_content_id = LAST_INSERT_ID();

        -- Insert into Blog_Posts table
        INSERT INTO Blog_Posts (Content_ID, Category, Allow_Comments, Is_Published, Publication_Date)
        VALUES (new_content_id, p_category, p_allow_comments, p_is_published,
                CASE WHEN p_is_published THEN NOW() ELSE NULL END);

        -- Create metrics entry
        INSERT INTO Content_Metrics (Content_ID) VALUES (new_content_id);

        -- Log the action
        IF user_role = 1 THEN -- Admin
            INSERT INTO Audit_Logs (Admin_ID, Action_Type, Action_Details)
            VALUES (p_user_id, 'Create Blog Post', CONCAT('Created blog post: ', p_title));
        END IF;

        SELECT 'Blog post created successfully' AS message, new_content_id AS content_id;
    ELSE
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User does not have permission to create blog posts';
    END IF;
END //

CREATE PROCEDURE create_research_paper(
    IN p_user_id INT,
    IN p_title VARCHAR(255),
    IN p_summary TEXT,
    IN p_content TEXT,
    IN p_featured_image VARCHAR(255),
    IN p_tags VARCHAR(255),
    IN p_authors VARCHAR(255),
    IN p_publication VARCHAR(255),
    IN p_publication_date DATE,
    IN p_doi VARCHAR(100),
    IN p_keywords VARCHAR(255),
    IN p_abstract TEXT
)
BEGIN
    DECLARE new_content_id INT;
    DECLARE user_role INT;

    -- Check if user has permission to create research papers
    SELECT Role_ID INTO user_role FROM Users WHERE User_ID = p_user_id;

    IF user_role IN (1, 2) THEN -- Admin or Editor
        -- Insert into Content table
        INSERT INTO Content (User_ID, Content_Type, Title, Summary, Content, Featured_Image, Tags, Status)
        VALUES (p_user_id, 'Research_Paper', p_title, p_summary, p_content, p_featured_image, p_tags, 'Active');

        -- Get the Content_ID of the newly created content
        SET new_content_id = LAST_INSERT_ID();

        -- Insert into Research_Papers table
        INSERT INTO Research_Papers (Content_ID, Authors, Publication, Publication_Date, DOI, Keywords, Abstract)
        VALUES (new_content_id, p_authors, p_publication, p_publication_date, p_doi, p_keywords, p_abstract);

        -- Create metrics entry
        INSERT INTO Content_Metrics (Content_ID) VALUES (new_content_id);

        -- Log the action
        IF user_role = 1 THEN -- Admin
            INSERT INTO Audit_Logs (Admin_ID, Action_Type, Action_Details)
            VALUES (p_user_id, 'Create Research Paper', CONCAT('Created research paper: ', p_title));
        END IF;

        SELECT 'Research paper created successfully' AS message, new_content_id AS content_id;
    ELSE
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User does not have permission to create research papers';
    END IF;
END //

CREATE PROCEDURE create_note(
    IN p_user_id INT,
    IN p_title VARCHAR(255),
    IN p_content TEXT,
    IN p_category VARCHAR(100),
    IN p_is_private BOOLEAN
)
BEGIN
    DECLARE new_content_id INT;
    DECLARE user_role INT;

    -- Check if user has permission to create notes
    SELECT Role_ID INTO user_role FROM Users WHERE User_ID = p_user_id;

    IF user_role IN (1, 2) THEN -- Admin or Editor
        -- Insert into Content table
        INSERT INTO Content (User_ID, Content_Type, Title, Content, Status)
        VALUES (p_user_id, 'Note', p_title, p_content, 'Active');

        -- Get the Content_ID of the newly created content
        SET new_content_id = LAST_INSERT_ID();

        -- Insert into Notes table
        INSERT INTO Notes (Content_ID, Category, Is_Private)
        VALUES (new_content_id, p_category, p_is_private);

        -- Create metrics entry (only if note is not private)
        IF NOT p_is_private THEN
            INSERT INTO Content_Metrics (Content_ID) VALUES (new_content_id);
        END IF;

        SELECT 'Note created successfully' AS message, new_content_id AS content_id;
    ELSE
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User does not have permission to create notes';
    END IF;
END //

CREATE PROCEDURE create_course(
    IN p_user_id INT,
    IN p_title VARCHAR(255),
    IN p_summary TEXT,
    IN p_content TEXT,
    IN p_featured_image VARCHAR(255),
    IN p_tags VARCHAR(255),
    IN p_instructor VARCHAR(255),
    IN p_duration VARCHAR(50),
    IN p_start_date DATE,
    IN p_end_date DATE,
    IN p_enrollment_limit INT,
    IN p_prerequisites TEXT,
    IN p_syllabus TEXT
)
BEGIN
    DECLARE new_content_id INT;
    DECLARE user_role INT;

    -- Check if user has permission to create courses
    SELECT Role_ID INTO user_role FROM Users WHERE User_ID = p_user_id;

    IF user_role IN (1, 2) THEN -- Admin or Editor
        -- Insert into Content table
        INSERT INTO Content (User_ID, Content_Type, Title, Summary, Content, Featured_Image, Tags, Status)
        VALUES (p_user_id, 'Course', p_title, p_summary, p_content, p_featured_image, p_tags, 'Active');

        -- Get the Content_ID of the newly created content
        SET new_content_id = LAST_INSERT_ID();

        -- Insert into Available_Courses table
        INSERT INTO Available_Courses (Content_ID, Instructor, Duration, Start_Date, End_Date,
                                     Enrollment_Limit, Prerequisites, Syllabus)
        VALUES (new_content_id, p_instructor, p_duration, p_start_date, p_end_date,
               p_enrollment_limit, p_prerequisites, p_syllabus);

        -- Create metrics entry
        INSERT INTO Content_Metrics (Content_ID) VALUES (new_content_id);

        -- Log the action
        IF user_role = 1 THEN -- Admin
            INSERT INTO Audit_Logs (Admin_ID, Action_Type, Action_Details)
            VALUES (p_user_id, 'Create Course', CONCAT('Created course: ', p_title));
        END IF;

        SELECT 'Course created successfully' AS message, new_content_id AS content_id;
    ELSE
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User does not have permission to create courses';
    END IF;
END //

CREATE PROCEDURE update_content_status(
    IN p_admin_id INT,
    IN p_content_id INT,
    IN p_status ENUM('Active', 'Inactive', 'Deleted', 'Banned', 'Restricted', 'Pending')
)
BEGIN
    DECLARE user_role INT;
    DECLARE content_owner INT;
    DECLARE content_title VARCHAR(255);

    -- Check if user has permission to update content status
    SELECT Role_ID INTO user_role FROM Users WHERE User_ID = p_admin_id;

    -- Get content owner and title
    SELECT User_ID, Title INTO content_owner, content_title FROM Content WHERE Content_ID = p_content_id;

    IF user_role = 1 OR (user_role = 2 AND content_owner = p_admin_id) THEN
        -- Update content status
        UPDATE Content SET Status = p_status, Updated_At = NOW() WHERE Content_ID = p_content_id;

        -- Log the action
        INSERT INTO Audit_Logs (Admin_ID, Action_Type, Action_Details)
        VALUES (p_admin_id, CONCAT('Update Content Status to ', p_status),
                CONCAT('Updated status of content ID ', p_content_id, ' (', content_title, ') to ', p_status));

        SELECT CONCAT('Content status updated to ', p_status) AS message;
    ELSE
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User does not have permission to update this content status';
    END IF;
END //

CREATE PROCEDURE add_comment(
    IN p_user_id INT,
    IN p_content_id INT,
    IN p_comment_content TEXT,
    IN p_parent_comment_id INT
)
BEGIN
    DECLARE content_type VARCHAR(50);
    DECLARE allow_comments BOOLEAN;
    DECLARE content_status VARCHAR(20);

    -- Check if the content exists and is active
    SELECT c.Content_Type, c.Status, IFNULL(bp.Allow_Comments, TRUE)
    INTO content_type, content_status, allow_comments
    FROM Content c
    LEFT JOIN Blog_Posts bp ON c.Content_ID = bp.Content_ID AND c.Content_Type = 'Blog_Post'
    WHERE c.Content_ID = p_content_id;

    IF content_status IN ('Active', 'Restricted') THEN
        IF content_type = 'Blog_Post' AND allow_comments = TRUE THEN
            -- Insert the comment
            INSERT INTO Content_Comments (Content_ID, User_ID, Comment_Content, Parent_Comment_ID)
            VALUES (p_content_id, p_user_id, p_comment_content, p_parent_comment_id);

            -- Update comment count in metrics
            UPDATE Content_Metrics
            SET Comments_Count = Comments_Count + 1, Last_Updated = NOW()
            WHERE Content_ID = p_content_id;

            SELECT 'Comment added successfully' AS message;
        ELSE
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Comments are not allowed on this content';
        END IF;
    ELSE
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot comment on inactive or deleted content';
    END IF;
END //

CREATE PROCEDURE get_content_metrics(
    IN p_user_id INT,
    IN p_content_id INT
)
BEGIN
    DECLARE user_role INT;
    DECLARE content_owner INT;

    -- Check user role and content ownership
    SELECT Role_ID INTO user_role FROM Users WHERE User_ID = p_user_id;
    SELECT User_ID INTO content_owner FROM Content WHERE Content_ID = p_content_id;

    IF user_role = 1 OR (user_role = 2 AND content_owner = p_user_id) THEN
        -- Return metrics for the content
        SELECT
            c.Content_ID,
            c.Title,
            c.Content_Type,
            c.Created_At,
            cm.Views,
            cm.Likes,
            cm.Shares,
            cm.Comments_Count,
            cm.Avg_Time_Spent,
            cm.Bounce_Rate,
            cm.Last_Updated
        FROM Content c
        JOIN Content_Metrics cm ON c.Content_ID = cm.Content_ID
        WHERE c.Content_ID = p_content_id;
    ELSE
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User does not have permission to view these metrics';
    END IF;
END //

CREATE PROCEDURE create_job(
    IN p_user_id INT,
    IN p_title VARCHAR(255),
    IN p_summary TEXT,
    IN p_content TEXT,
    IN p_featured_image VARCHAR(255),
    IN p_tags VARCHAR(255),
    IN p_company_name VARCHAR(255),
    IN p_location VARCHAR(255),
    IN p_job_type ENUM('Full-time', 'Part-time', 'Contract', 'Remote', 'Hybrid'),
    IN p_salary_range VARCHAR(100),
    IN p_experience_required VARCHAR(100),
    IN p_eligibility_criteria TEXT,
    IN p_application_deadline DATE,
    IN p_contact_email VARCHAR(255),
    IN p_contact_phone VARCHAR(50),
    IN p_is_featured BOOLEAN
)
BEGIN
    DECLARE new_content_id INT;
    DECLARE user_role INT;

    -- Check if user has permission to create job postings
    SELECT Role_ID INTO user_role FROM Users WHERE User_ID = p_user_id;

    IF user_role IN (1, 2) THEN -- Admin or Editor
        -- Insert into Content table
        INSERT INTO Content (User_ID, Content_Type, Title, Summary, Content, Featured_Image, Tags, Status, Is_Featured)
        VALUES (p_user_id, 'Job', p_title, p_summary, p_content, p_featured_image, p_tags, 'Active', p_is_featured);

        -- Get the Content_ID of the newly created content
        SET new_content_id = LAST_INSERT_ID();

        -- Insert into Jobs table
        INSERT INTO Jobs (Content_ID, Company_Name, Location, Job_Type, Salary_Range,
                        Experience_Required, Eligibility_Criteria, Application_Deadline,
                        Contact_Email, Contact_Phone, Is_Featured)
        VALUES (new_content_id, p_company_name, p_location, p_job_type, p_salary_range,
                p_experience_required, p_eligibility_criteria, p_application_deadline,
                p_contact_email, p_contact_phone, p_is_featured);

        -- Create metrics entry
        INSERT INTO Content_Metrics (Content_ID) VALUES (new_content_id);

        -- Log the action
        IF user_role = 1 THEN -- Admin
            INSERT INTO Audit_Logs (Admin_ID, Action_Type, Action_Details)
            VALUES (p_user_id, 'Create Job Posting', CONCAT('Created job posting: ', p_title));
        END IF;

        SELECT 'Job posting created successfully' AS message, new_content_id AS content_id;
    ELSE
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User does not have permission to create job postings';
    END IF;
END //

CREATE PROCEDURE create_internship(
    IN p_user_id INT,
    IN p_title VARCHAR(255),
    IN p_summary TEXT,
    IN p_content TEXT,
    IN p_featured_image VARCHAR(255),
    IN p_tags VARCHAR(255),
    IN p_company_name VARCHAR(255),
    IN p_location VARCHAR(255),
    IN p_internship_type ENUM('Full-time', 'Part-time', 'Remote', 'Hybrid'),
    IN p_stipend VARCHAR(100),
    IN p_duration VARCHAR(100),
    IN p_eligibility_criteria TEXT,
    IN p_application_deadline DATE,
    IN p_contact_email VARCHAR(255),
    IN p_contact_phone VARCHAR(50),
    IN p_is_featured BOOLEAN
)
BEGIN
    DECLARE new_content_id INT;
    DECLARE user_role INT;

    -- Check if user has permission to create internship postings
    SELECT Role_ID INTO user_role FROM Users WHERE User_ID = p_user_id;

    IF user_role IN (1, 2) THEN -- Admin or Editor
        -- Insert into Content table
        INSERT INTO Content (User_ID, Content_Type, Title, Summary, Content, Featured_Image, Tags, Status, Is_Featured)
        VALUES (p_user_id, 'Internship', p_title, p_summary, p_content, p_featured_image, p_tags, 'Active', p_is_featured);

        -- Get the Content_ID of the newly created content
        SET new_content_id = LAST_INSERT_ID();

        -- Insert into Internships table
        INSERT INTO Internships (Content_ID, Company_Name, Location, Internship_Type, Stipend,
                               Duration, Eligibility_Criteria, Application_Deadline,
                               Contact_Email, Contact_Phone, Is_Featured)
        VALUES (new_content_id, p_company_name, p_location, p_internship_type, p_stipend,
                p_duration, p_eligibility_criteria, p_application_deadline,
                p_contact_email, p_contact_phone, p_is_featured);

        -- Create metrics entry
        INSERT INTO Content_Metrics (Content_ID) VALUES (new_content_id);

        -- Log the action
        IF user_role = 1 THEN -- Admin
            INSERT INTO Audit_Logs (Admin_ID, Action_Type, Action_Details)
            VALUES (p_user_id, 'Create Internship Posting', CONCAT('Created internship posting: ', p_title));
        END IF;

        SELECT 'Internship posting created successfully' AS message, new_content_id AS content_id;
    ELSE
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User does not have permission to create internship postings';
    END IF;
END //

CREATE PROCEDURE apply_for_job(
    IN p_user_id INT,
    IN p_job_id INT,
    IN p_resume_url VARCHAR(255),
    IN p_cover_letter TEXT
)
BEGIN
    DECLARE job_exists INT;
    DECLARE already_applied INT;
    DECLARE application_deadline DATE;
    DECLARE job_status VARCHAR(20);

    -- Check if the job exists and is active
    SELECT j.Application_Deadline, c.Status
    INTO application_deadline, job_status
    FROM Jobs j
    JOIN Content c ON j.Content_ID = c.Content_ID
    WHERE j.Job_ID = p_job_id;

    -- Check if job exists
    SELECT COUNT(*) INTO job_exists
    FROM Jobs j
    WHERE j.Job_ID = p_job_id;

    IF job_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Job posting not found';
    ELSEIF job_status != 'Active' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'This job posting is no longer active';
    ELSEIF application_deadline < CURDATE() THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'The application deadline for this job has passed';
    ELSE
        -- Check if user has already applied for this job
        SELECT COUNT(*) INTO already_applied
        FROM Job_Applications
        WHERE Job_ID = p_job_id AND User_ID = p_user_id;

        IF already_applied > 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'You have already applied for this job';
        ELSE
            -- Insert the application
            INSERT INTO Job_Applications (Job_ID, User_ID, Resume_URL, Cover_Letter)
            VALUES (p_job_id, p_user_id, p_resume_url, p_cover_letter);

            SELECT 'Application submitted successfully' AS message;
        END IF;
    END IF;
END //

CREATE PROCEDURE apply_for_internship(
    IN p_user_id INT,
    IN p_internship_id INT,
    IN p_resume_url VARCHAR(255),
    IN p_cover_letter TEXT
)
BEGIN
    DECLARE internship_exists INT;
    DECLARE already_applied INT;
    DECLARE application_deadline DATE;
    DECLARE internship_status VARCHAR(20);

    -- Check if the internship exists and is active
    SELECT i.Application_Deadline, c.Status
    INTO application_deadline, internship_status
    FROM Internships i
    JOIN Content c ON i.Content_ID = c.Content_ID
    WHERE i.Internship_ID = p_internship_id;

    -- Check if internship exists
    SELECT COUNT(*) INTO internship_exists
    FROM Internships i
    WHERE i.Internship_ID = p_internship_id;

    IF internship_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Internship posting not found';
    ELSEIF internship_status != 'Active' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'This internship posting is no longer active';
    ELSEIF application_deadline < CURDATE() THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'The application deadline for this internship has passed';
    ELSE
        -- Check if user has already applied for this internship
        SELECT COUNT(*) INTO already_applied
        FROM Internship_Applications
        WHERE Internship_ID = p_internship_id AND User_ID = p_user_id;

        IF already_applied > 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'You have already applied for this internship';
        ELSE
            -- Insert the application
            INSERT INTO Internship_Applications (Internship_ID, User_ID, Resume_URL, Cover_Letter)
            VALUES (p_internship_id, p_user_id, p_resume_url, p_cover_letter);

            SELECT 'Application submitted successfully' AS message;
        END IF;
    END IF;
END //

DELIMITER ;

-- Insert default admin user with bcrypt hashed password
INSERT INTO Users (Email, Password, Role_ID, Is_Super_Admin, Status) VALUES
('admin@lawfort.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RX.PZa2u2', 1, TRUE, 'Active');

-- Get the admin user ID and insert profile
SET @admin_user_id = (SELECT User_ID FROM Users WHERE Email = 'admin@lawfort.com');

INSERT INTO User_Profile (User_ID, Full_Name, Phone, Bio, Profile_Pic, Law_Specialization,
                        Education, Bar_Exam_Status, License_Number, Practice_Area, Location,
                        Years_of_Experience, LinkedIn_Profile, Alumni_of, Professional_Organizations)
VALUES (@admin_user_id, 'System Administrator', '+1-555-0123',
        'Default system administrator account with full access',
        '', 'Legal Technology & Administration', 'J.D.', 'Passed', 'ADMIN001',
        'System Administration', 'New York, NY', 5, '', '', 'American Bar Association');

-- =====================================================
-- END OF DATABASE SETUP
-- =====================================================
--
-- The database is now ready for use with:
-- - Complete schema with all tables and relationships
-- - Stored procedures for common operations
-- - Default admin account (admin@lawfort.com / admin123)
-- - Role-based permission system
--
-- To start using the system:
-- 1. Run this SQL script to create the database
-- 2. Start the Flask backend server
-- 3. Login with admin credentials to begin setup
--
-- =====================================================