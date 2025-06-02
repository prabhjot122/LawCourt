-- Simple SQL script to insert sample courses directly
-- Execute this in MySQL command line or phpMyAdmin

USE lawfort;

-- Insert Course 1: Constitutional Law Fundamentals
INSERT INTO Content (User_ID, Content_Type, Title, Summary, Content, Featured_Image, Tags, Status, Is_Featured)
VALUES (1, 'Course', 'Constitutional Law Fundamentals', 
'A comprehensive introduction to constitutional law principles, covering fundamental rights, separation of powers, and judicial review.',
'<h2>Course Overview</h2><p>This foundational course explores constitutional law principles that govern modern democratic societies.</p><h3>Learning Objectives</h3><ul><li>Understand constitutional law development</li><li>Analyze separation of powers</li><li>Examine fundamental rights</li></ul>',
'/images/courses/constitutional-law.jpg',
'constitutional law, fundamental rights, government, democracy',
'Active', FALSE);

SET @content_id_1 = LAST_INSERT_ID();

INSERT INTO Available_Courses (Content_ID, Instructor, Duration, Start_Date, End_Date, Enrollment_Limit, Current_Enrollment, Prerequisites, Syllabus)
VALUES (@content_id_1, 'Prof. Sarah Mitchell, J.D., Ph.D.', '12 weeks', '2024-02-15', '2024-05-10', 30, 0,
'Basic understanding of legal principles recommended but not required.',
'Week 1-2: Constitutional Foundations, Week 3-4: Government Structure, Week 5-6: Separation of Powers');

INSERT INTO Content_Metrics (Content_ID) VALUES (@content_id_1);

-- Insert Course 2: Contract Law Essentials
INSERT INTO Content (User_ID, Content_Type, Title, Summary, Content, Featured_Image, Tags, Status, Is_Featured)
VALUES (1, 'Course', 'Contract Law Essentials',
'Master the fundamentals of contract law including formation, performance, breach, and remedies.',
'<h2>Course Overview</h2><p>Contract Law Essentials provides comprehensive foundation in contract law principles and practice.</p><h3>Learning Objectives</h3><ul><li>Master contract formation elements</li><li>Understand contract interpretation</li><li>Analyze performance and breach</li></ul>',
'/images/courses/contract-law.jpg',
'contract law, agreements, business law, legal practice',
'Active', FALSE);

SET @content_id_2 = LAST_INSERT_ID();

INSERT INTO Available_Courses (Content_ID, Instructor, Duration, Start_Date, End_Date, Enrollment_Limit, Current_Enrollment, Prerequisites, Syllabus)
VALUES (@content_id_2, 'Prof. Michael Chen, J.D., LL.M.', '10 weeks', '2024-03-01', '2024-05-15', 25, 0,
'Introduction to Law course or equivalent legal background.',
'Week 1-2: Contract Formation, Week 3-4: Terms and Interpretation, Week 5-6: Performance Standards');

INSERT INTO Content_Metrics (Content_ID) VALUES (@content_id_2);

-- Insert Course 3: Criminal Law and Procedure
INSERT INTO Content (User_ID, Content_Type, Title, Summary, Content, Featured_Image, Tags, Status, Is_Featured)
VALUES (1, 'Course', 'Criminal Law and Procedure',
'Comprehensive study of criminal law principles and criminal procedure, covering elements of crimes, defenses, and constitutional protections.',
'<h2>Course Overview</h2><p>This comprehensive course examines both substantive criminal law and criminal procedure.</p><h3>Learning Objectives</h3><ul><li>Understand elements of criminal offenses</li><li>Analyze criminal defenses</li><li>Examine constitutional protections</li></ul>',
'/images/courses/criminal-law.jpg',
'criminal law, criminal procedure, constitutional law, criminal justice',
'Active', FALSE);

SET @content_id_3 = LAST_INSERT_ID();

INSERT INTO Available_Courses (Content_ID, Instructor, Duration, Start_Date, End_Date, Enrollment_Limit, Current_Enrollment, Prerequisites, Syllabus)
VALUES (@content_id_3, 'Prof. David Rodriguez, J.D., Former Prosecutor', '14 weeks', '2024-01-20', '2024-04-30', 35, 0,
'Constitutional Law Fundamentals or equivalent.',
'Week 1-2: Criminal Law Foundations, Week 3-4: Elements of Crimes, Week 5-6: Specific Offenses');

INSERT INTO Content_Metrics (Content_ID) VALUES (@content_id_3);

-- Verify the insertions
SELECT 'Sample courses inserted successfully!' AS message;

SELECT 
    c.Content_ID,
    c.Title,
    c.Summary,
    ac.Instructor,
    ac.Duration,
    ac.Start_Date,
    ac.End_Date,
    ac.Enrollment_Limit
FROM Content c
JOIN Available_Courses ac ON c.Content_ID = ac.Content_ID
WHERE c.Content_Type = 'Course'
ORDER BY c.Created_At DESC;
