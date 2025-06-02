-- =====================================================
-- CONTENT VISIBILITY FIX SCRIPT
-- =====================================================
-- 
-- This script fixes content visibility issues where blog posts
-- and research papers created by admins/editors are not showing
-- up on the frontend due to incorrect status/publication settings.
-- 
-- Run this script if you have existing content that's not visible.
-- 
-- =====================================================

USE lawfort;

-- Fix Content table status for admin/editor content
UPDATE Content 
SET Status = 'Active' 
WHERE Content_Type IN ('Blog_Post', 'Research_Paper', 'Note') 
  AND Status = 'Inactive'
  AND User_ID IN (
    SELECT User_ID FROM Users WHERE Role_ID IN (1, 2)  -- Admin and Editor roles
  );

-- Fix Blog_Posts publication status for admin/editor content
UPDATE Blog_Posts bp
JOIN Content c ON bp.Content_ID = c.Content_ID
JOIN Users u ON c.User_ID = u.User_ID
SET bp.Is_Published = TRUE,
    bp.Publication_Date = COALESCE(bp.Publication_Date, c.Created_At)
WHERE u.Role_ID IN (1, 2)  -- Admin and Editor roles
  AND bp.Is_Published = FALSE;

-- Show results
SELECT 'Blog Posts' as content_type, COUNT(*) as visible_count
FROM Content c
JOIN Blog_Posts bp ON c.Content_ID = bp.Content_ID
WHERE c.Content_Type = 'Blog_Post' 
  AND c.Status = 'Active' 
  AND bp.Is_Published = TRUE

UNION ALL

SELECT 'Research Papers' as content_type, COUNT(*) as visible_count
FROM Content c
JOIN Research_Papers rp ON c.Content_ID = rp.Content_ID
WHERE c.Content_Type = 'Research_Paper' 
  AND c.Status = 'Active'

UNION ALL

SELECT 'Notes' as content_type, COUNT(*) as visible_count
FROM Content c
JOIN Notes n ON c.Content_ID = n.Content_ID
WHERE c.Content_Type = 'Note' 
  AND c.Status = 'Active'
  AND n.Is_Private = FALSE;

-- =====================================================
-- END OF FIX SCRIPT
-- =====================================================
