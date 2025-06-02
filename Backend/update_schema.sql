-- Update the Content table Status column to include 'Pending'
USE lawfort;

ALTER TABLE Content 
MODIFY COLUMN Status ENUM('Active', 'Inactive', 'Deleted', 'Banned', 'Restricted', 'Pending') DEFAULT 'Active';

-- Update the stored procedure to include 'Pending' status
DROP PROCEDURE IF EXISTS update_content_status;

DELIMITER //

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

DELIMITER ;

SELECT 'Schema updated successfully - Content table now supports Pending status' AS message;
