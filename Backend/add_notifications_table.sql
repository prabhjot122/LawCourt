-- Add Notifications table to existing database
USE lawfort;

CREATE TABLE IF NOT EXISTS Notifications (
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
