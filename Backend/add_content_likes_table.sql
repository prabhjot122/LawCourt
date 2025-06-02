-- Migration to add Content_Likes table for tracking individual user likes
-- This allows us to track which users liked which content and prevent duplicate likes

-- Create Content_Likes table
CREATE TABLE IF NOT EXISTS Content_Likes (
    Like_ID INT AUTO_INCREMENT PRIMARY KEY,
    User_ID INT NOT NULL,
    Content_ID INT NOT NULL,
    Liked_At DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (User_ID) REFERENCES Users(User_ID) ON DELETE CASCADE,
    FOREIGN KEY (Content_ID) REFERENCES Content(Content_ID) ON DELETE CASCADE,
    UNIQUE KEY unique_user_content_like (User_ID, Content_ID)
);

-- Add index for better performance
CREATE INDEX idx_content_likes_content_id ON Content_Likes(Content_ID);
CREATE INDEX idx_content_likes_user_id ON Content_Likes(User_ID);

-- Insert sample data for testing (optional)
-- You can uncomment these lines if you want some test data
/*
INSERT IGNORE INTO Content_Likes (User_ID, Content_ID) VALUES
(1, 1),  -- Admin likes first blog post
(2, 1),  -- Editor likes first blog post
(1, 2);  -- Admin likes second blog post
*/

-- Update existing Content_Metrics to ensure all content has metrics
INSERT IGNORE INTO Content_Metrics (Content_ID, Views, Likes, Shares, Comments_Count)
SELECT 
    c.Content_ID,
    0 as Views,
    0 as Likes,
    0 as Shares,
    0 as Comments_Count
FROM Content c
WHERE c.Content_ID NOT IN (SELECT Content_ID FROM Content_Metrics);

-- Update the likes count in Content_Metrics based on existing likes (if any)
UPDATE Content_Metrics cm
SET Likes = (
    SELECT COUNT(*)
    FROM Content_Likes cl
    WHERE cl.Content_ID = cm.Content_ID
),
Last_Updated = NOW()
WHERE cm.Content_ID IN (SELECT DISTINCT Content_ID FROM Content_Likes);

-- Add a trigger to automatically update Content_Metrics when likes are added
DELIMITER //

DROP TRIGGER IF EXISTS update_likes_on_insert //
CREATE TRIGGER update_likes_on_insert
    AFTER INSERT ON Content_Likes
    FOR EACH ROW
BEGIN
    -- Update the likes count in Content_Metrics
    UPDATE Content_Metrics 
    SET Likes = Likes + 1, Last_Updated = NOW()
    WHERE Content_ID = NEW.Content_ID;
    
    -- If no metrics record exists, create one
    INSERT IGNORE INTO Content_Metrics (Content_ID, Views, Likes, Shares, Comments_Count)
    VALUES (NEW.Content_ID, 0, 1, 0, 0);
END //

DROP TRIGGER IF EXISTS update_likes_on_delete //
CREATE TRIGGER update_likes_on_delete
    AFTER DELETE ON Content_Likes
    FOR EACH ROW
BEGIN
    -- Update the likes count in Content_Metrics
    UPDATE Content_Metrics 
    SET Likes = GREATEST(Likes - 1, 0), Last_Updated = NOW()
    WHERE Content_ID = OLD.Content_ID;
END //

DELIMITER ;

-- Verify the table was created successfully
SELECT 'Content_Likes table created successfully!' as Status;

-- Show the table structure
DESCRIBE Content_Likes;
