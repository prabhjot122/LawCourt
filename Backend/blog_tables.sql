-- Blog Tables for LawFort Database
USE lawfort;

-- Create Blog_Posts table if it doesn't exist
CREATE TABLE IF NOT EXISTS Blog_Posts (
    Post_ID INT AUTO_INCREMENT PRIMARY KEY,
    User_ID INT NOT NULL,
    Title VARCHAR(255) NOT NULL,
    Content TEXT NOT NULL,
    Image_URL VARCHAR(255),
    Views INT DEFAULT 0,
    Created_At DATETIME DEFAULT CURRENT_TIMESTAMP,
    Updated_At DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (User_ID) REFERENCES Users(User_ID)
);

-- Create Blog_Tags table if it doesn't exist
CREATE TABLE IF NOT EXISTS Blog_Tags (
    Tag_ID INT AUTO_INCREMENT PRIMARY KEY,
    Post_ID INT NOT NULL,
    Tag_Name VARCHAR(50) NOT NULL,
    FOREIGN KEY (Post_ID) REFERENCES Blog_Posts(Post_ID) ON DELETE CASCADE,
    UNIQUE KEY unique_post_tag (Post_ID, Tag_Name)
);

-- Create Blog_Comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS Blog_Comments (
    Comment_ID INT AUTO_INCREMENT PRIMARY KEY,
    Post_ID INT NOT NULL,
    User_ID INT NOT NULL,
    Content TEXT NOT NULL,
    Created_At DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Post_ID) REFERENCES Blog_Posts(Post_ID) ON DELETE CASCADE,
    FOREIGN KEY (User_ID) REFERENCES Users(User_ID)
);

-- Rename Post_Tags to Blog_Tags if it exists
DROP TABLE IF EXISTS Post_Tags;

-- Show tables to verify creation
SHOW TABLES LIKE 'Blog_%';