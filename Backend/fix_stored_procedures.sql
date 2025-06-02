-- Fix the stored procedures to resolve the GROUP BY error

USE lawfort;

DELIMITER //

-- Drop and recreate the apply_for_job procedure
DROP PROCEDURE IF EXISTS apply_for_job //

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

-- Drop and recreate the apply_for_internship procedure
DROP PROCEDURE IF EXISTS apply_for_internship //

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
