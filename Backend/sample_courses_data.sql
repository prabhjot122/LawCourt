-- Sample Courses Data for LawFort Platform
-- This file contains sample data for three courses

USE lawfort;

-- Insert sample courses using the create_course procedure
-- Note: Using user_id = 1 (assuming this is an admin user)

-- Course 1: Constitutional Law Fundamentals
CALL create_course(
    1, -- user_id (admin)
    'Constitutional Law Fundamentals', -- title
    'A comprehensive introduction to constitutional law principles, covering fundamental rights, separation of powers, and judicial review. This course provides essential knowledge for understanding the constitutional framework of modern democracies.', -- summary
    '<h2>Course Overview</h2>
<p>This foundational course in Constitutional Law explores the fundamental principles that govern modern democratic societies. Students will examine the structure of government, the separation of powers, and the protection of individual rights under constitutional frameworks.</p>

<h3>Learning Objectives</h3>
<ul>
<li>Understand the historical development of constitutional law</li>
<li>Analyze the separation of powers doctrine</li>
<li>Examine fundamental rights and their limitations</li>
<li>Study landmark constitutional cases</li>
<li>Develop skills in constitutional interpretation</li>
</ul>

<h3>Course Modules</h3>
<h4>Module 1: Introduction to Constitutional Law</h4>
<p>Historical foundations, sources of constitutional law, and basic principles.</p>

<h4>Module 2: Structure of Government</h4>
<p>Executive, legislative, and judicial branches; checks and balances.</p>

<h4>Module 3: Fundamental Rights</h4>
<p>Civil liberties, civil rights, and their constitutional protection.</p>

<h4>Module 4: Judicial Review</h4>
<p>Role of courts in constitutional interpretation and enforcement.</p>

<h4>Module 5: Contemporary Issues</h4>
<p>Modern constitutional challenges and evolving interpretations.</p>

<h3>Assessment Methods</h3>
<ul>
<li>Weekly quizzes (20%)</li>
<li>Mid-term examination (30%)</li>
<li>Research paper (25%)</li>
<li>Final examination (25%)</li>
</ul>', -- content
    '/images/courses/constitutional-law.jpg', -- featured_image
    'constitutional law, fundamental rights, government, democracy, legal education', -- tags
    'Prof. Sarah Mitchell, J.D., Ph.D.', -- instructor
    '12 weeks', -- duration
    '2024-02-15', -- start_date
    '2024-05-10', -- end_date
    30, -- enrollment_limit
    'Basic understanding of legal principles recommended but not required. High school diploma or equivalent.', -- prerequisites
    'Week 1-2: Constitutional Foundations
Week 3-4: Government Structure
Week 5-6: Separation of Powers
Week 7-8: Fundamental Rights
Week 9-10: Judicial Review
Week 11-12: Contemporary Issues and Review' -- syllabus
);

-- Course 2: Contract Law Essentials
CALL create_course(
    1, -- user_id (admin)
    'Contract Law Essentials', -- title
    'Master the fundamentals of contract law including formation, performance, breach, and remedies. This practical course covers essential concepts for legal professionals and business practitioners.', -- summary
    '<h2>Course Overview</h2>
<p>Contract Law Essentials provides a comprehensive foundation in contract law principles and practice. This course is designed for law students, legal professionals, and business practitioners who need to understand contractual relationships and obligations.</p>

<h3>Learning Objectives</h3>
<ul>
<li>Master the elements of contract formation</li>
<li>Understand contract interpretation principles</li>
<li>Analyze performance and breach issues</li>
<li>Evaluate remedies for contract violations</li>
<li>Apply contract law to real-world scenarios</li>
</ul>

<h3>Course Content</h3>
<h4>Unit 1: Contract Formation</h4>
<p>Offer, acceptance, consideration, and capacity requirements.</p>

<h4>Unit 2: Contract Terms and Interpretation</h4>
<p>Express and implied terms, parol evidence rule, and interpretation methods.</p>

<h4>Unit 3: Performance and Discharge</h4>
<p>Conditions, performance standards, and discharge of obligations.</p>

<h4>Unit 4: Breach and Remedies</h4>
<p>Types of breach, damages, specific performance, and other remedies.</p>

<h4>Unit 5: Special Contract Types</h4>
<p>Sales contracts, employment agreements, and consumer contracts.</p>

<h3>Practical Applications</h3>
<ul>
<li>Contract drafting exercises</li>
<li>Case study analysis</li>
<li>Negotiation simulations</li>
<li>Real-world problem solving</li>
</ul>', -- content
    '/images/courses/contract-law.jpg', -- featured_image
    'contract law, agreements, business law, legal practice, commercial law', -- tags
    'Prof. Michael Chen, J.D., LL.M.', -- instructor
    '10 weeks', -- duration
    '2024-03-01', -- start_date
    '2024-05-15', -- end_date
    25, -- enrollment_limit
    'Introduction to Law course or equivalent legal background. Basic understanding of legal terminology.', -- prerequisites
    'Week 1-2: Contract Formation Basics
Week 3-4: Terms and Interpretation
Week 5-6: Performance Standards
Week 7-8: Breach and Remedies
Week 9-10: Special Contracts and Practice' -- syllabus
);

-- Course 3: Criminal Law and Procedure
CALL create_course(
    1, -- user_id (admin)
    'Criminal Law and Procedure', -- title
    'Comprehensive study of criminal law principles and criminal procedure, covering elements of crimes, defenses, constitutional protections, and the criminal justice process from investigation to trial.', -- summary
    '<h2>Course Overview</h2>
<p>This comprehensive course examines both substantive criminal law and criminal procedure. Students will study the elements of major crimes, available defenses, constitutional protections for the accused, and the procedural aspects of criminal justice from investigation through trial and appeal.</p>

<h3>Learning Objectives</h3>
<ul>
<li>Understand the elements of major criminal offenses</li>
<li>Analyze criminal defenses and their applications</li>
<li>Examine constitutional protections in criminal procedure</li>
<li>Study the criminal justice process comprehensively</li>
<li>Develop skills in criminal law analysis and advocacy</li>
</ul>

<h3>Course Structure</h3>
<h4>Part I: Substantive Criminal Law</h4>
<h5>Chapter 1: Foundations of Criminal Law</h5>
<p>Sources, purposes, and principles of criminal law.</p>

<h5>Chapter 2: Elements of Crimes</h5>
<p>Actus reus, mens rea, causation, and harm.</p>

<h5>Chapter 3: Specific Offenses</h5>
<p>Homicide, assault, theft, fraud, and other major crimes.</p>

<h5>Chapter 4: Defenses</h5>
<p>Self-defense, insanity, duress, and other criminal defenses.</p>

<h4>Part II: Criminal Procedure</h4>
<h5>Chapter 5: Constitutional Framework</h5>
<p>Fourth, Fifth, and Sixth Amendment protections.</p>

<h5>Chapter 6: Investigation and Arrest</h5>
<p>Search and seizure, interrogation, and arrest procedures.</p>

<h5>Chapter 7: Pre-Trial Process</h5>
<p>Charging, bail, plea bargaining, and discovery.</p>

<h5>Chapter 8: Trial and Appeal</h5>
<p>Trial procedures, evidence rules, and appellate process.</p>

<h3>Practical Components</h3>
<ul>
<li>Mock trial exercises</li>
<li>Case briefing and analysis</li>
<li>Constitutional law applications</li>
<li>Criminal procedure simulations</li>
</ul>', -- content
    '/images/courses/criminal-law.jpg', -- featured_image
    'criminal law, criminal procedure, constitutional law, criminal justice, legal procedure', -- tags
    'Prof. David Rodriguez, J.D., Former Prosecutor', -- instructor
    '14 weeks', -- duration
    '2024-01-20', -- start_date
    '2024-04-30', -- end_date
    35, -- enrollment_limit
    'Constitutional Law Fundamentals or equivalent. Basic understanding of legal system and court procedures.', -- prerequisites
    'Week 1-2: Criminal Law Foundations
Week 3-4: Elements of Crimes
Week 5-6: Specific Offenses (Part 1)
Week 7-8: Specific Offenses (Part 2)
Week 9-10: Criminal Defenses
Week 11-12: Constitutional Protections
Week 13-14: Criminal Procedure and Practice' -- syllabus
);

-- Display success message
SELECT 'Sample courses data has been successfully inserted!' AS message;

-- Query to verify the inserted courses
SELECT 
    c.Content_ID,
    c.Title,
    c.Summary,
    ac.Instructor,
    ac.Duration,
    ac.Start_Date,
    ac.End_Date,
    ac.Enrollment_Limit,
    c.Created_At
FROM Content c
JOIN Available_Courses ac ON c.Content_ID = ac.Content_ID
WHERE c.Content_Type = 'Course'
ORDER BY c.Created_At DESC
LIMIT 3;
