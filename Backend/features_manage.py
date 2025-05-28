import mysql.connector
from mysql.connector import pooling
import os
from datetime import datetime
import uuid
from flask import Blueprint, jsonify, request
import json
from database import get_db_connection, init_db_pool

# Initialize the blueprint
feature_bp = Blueprint('features', __name__)

# ==================== BLOG POST FUNCTIONS ====================

def create_blog_post(user_id, title, content, tags=None):
    """Create a new blog post"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Insert blog post
        cursor.execute("""
            INSERT INTO Blog_Posts (User_ID, Title, Content, Created_At, Updated_At)
            VALUES (%s, %s, %s, %s, %s)
        """, (user_id, title, content, datetime.now(), datetime.now()))
        
        post_id = cursor.lastrowid
        
        # Add tags if provided
        if tags:
            for tag in tags:
                cursor.execute("""
                    INSERT INTO Post_Tags (Post_ID, Tag_Name)
                    VALUES (%s, %s)
                """, (post_id, tag))
        
        conn.commit()
        return {"message": "Blog post created successfully", "post_id": post_id}, 201
    except Exception as e:
        conn.rollback()
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

def get_blog_posts(page=1, per_page=10, tag=None):
    """Get blog posts with pagination and optional filtering"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    offset = (page - 1) * per_page
    
    try:
        # Base query
        query = """
            SELECT bp.Post_ID, bp.User_ID, bp.Title, bp.Content, bp.Image_URL, 
                   bp.Created_At, bp.Updated_At, bp.Views, up.Full_Name as Author_Name,
                   (SELECT COUNT(*) FROM Blog_Comments WHERE Post_ID = bp.Post_ID) as Comment_Count,
                   GROUP_CONCAT(DISTINCT bt.Tag_Name) as Tags
            FROM Blog_Posts bp
            LEFT JOIN User_Profile up ON bp.User_ID = up.User_ID
            LEFT JOIN Blog_Tags bt ON bp.Post_ID = bt.Post_ID
        """
        
        # Add filters
        where_clauses = []
        params = []
        
        if tag:
            where_clauses.append("bp.Post_ID IN (SELECT Post_ID FROM Blog_Tags WHERE Tag_Name = %s)")
            params.append(tag)
        
        if where_clauses:
            query += " WHERE " + " AND ".join(where_clauses)
        
        # Add group by, order by and limit
        query += """
            GROUP BY bp.Post_ID
            ORDER BY bp.Created_At DESC
            LIMIT %s OFFSET %s
        """
        
        params.extend([per_page, offset])
        
        cursor.execute(query, params)
        posts = cursor.fetchall()
        
        # Get total count for pagination
        count_query = "SELECT COUNT(DISTINCT bp.Post_ID) as total FROM Blog_Posts bp"
        if where_clauses:
            count_query += " WHERE " + " AND ".join(where_clauses)
        
        cursor.execute(count_query, params[:-2] if params else [])
        total = cursor.fetchone()['total']
        
        # Process posts to convert datetime objects to strings
        for post in posts:
            post['Created_At'] = post['Created_At'].isoformat() if post['Created_At'] else None
            post['Updated_At'] = post['Updated_At'].isoformat() if post['Updated_At'] else None
            post['Tags'] = post['Tags'].split(',') if post['Tags'] else []
        
        return {
            "posts": posts,
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": (total + per_page - 1) // per_page
        }, 200
    except Exception as e:
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

def get_blog_post(post_id):
    """Get a single blog post by ID"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Increment view count
        cursor.execute("UPDATE Blog_Posts SET Views = Views + 1 WHERE Post_ID = %s", (post_id,))
        
        # Get post with author and tags
        cursor.execute("""
            SELECT bp.Post_ID, bp.User_ID, bp.Title, bp.Content, bp.Image_URL, 
                   bp.Created_At, bp.Updated_At, bp.Views, up.Full_Name as Author_Name,
                   up.Profile_Pic as Author_Profile_Pic
            FROM Blog_Posts bp
            LEFT JOIN User_Profile up ON bp.User_ID = up.User_ID
            WHERE bp.Post_ID = %s
        """, (post_id,))
        
        post = cursor.fetchone()
        
        if not post:
            return {"error": "Post not found"}, 404
        
        # Get tags
        cursor.execute("SELECT Tag_Name FROM Blog_Tags WHERE Post_ID = %s", (post_id,))
        tags = [row['Tag_Name'] for row in cursor.fetchall()]
        
        # Get comments
        cursor.execute("""
            SELECT bc.Comment_ID, bc.User_ID, bc.Content, bc.Created_At,
                   up.Full_Name as Commenter_Name, up.Profile_Pic as Commenter_Profile_Pic
            FROM Blog_Comments bc
            LEFT JOIN User_Profile up ON bc.User_ID = up.User_ID
            WHERE bc.Post_ID = %s
            ORDER BY bc.Created_At DESC
        """, (post_id,))
        
        comments = cursor.fetchall()
        
        # Process datetime objects
        post['Created_At'] = post['Created_At'].isoformat() if post['Created_At'] else None
        post['Updated_At'] = post['Updated_At'].isoformat() if post['Updated_At'] else None
        
        for comment in comments:
            comment['Created_At'] = comment['Created_At'].isoformat() if comment['Created_At'] else None
        
        post['Tags'] = tags
        post['Comments'] = comments
        
        conn.commit()  # Commit the view count update
        return {"post": post}, 200
    except Exception as e:
        conn.rollback()
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

def update_blog_post(post_id, user_id, title=None, content=None, tags=None, image_url=None):
    """Update an existing blog post"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if post exists and belongs to user
        cursor.execute("SELECT User_ID FROM Blog_Posts WHERE Post_ID = %s", (post_id,))
        post = cursor.fetchone()
        
        if not post:
            return {"error": "Post not found"}, 404
        
        if post[0] != user_id:
            return {"error": "Unauthorized to edit this post"}, 403
        
        # Update fields that are provided
        update_fields = []
        params = []
        
        if title is not None:
            update_fields.append("Title = %s")
            params.append(title)
        
        if content is not None:
            update_fields.append("Content = %s")
            params.append(content)
        
        if image_url is not None:
            update_fields.append("Image_URL = %s")
            params.append(image_url)
        
        update_fields.append("Updated_At = %s")
        params.append(datetime.now())
        
        # Add post_id to params
        params.append(post_id)
        
        # Execute update if there are fields to update
        if update_fields:
            query = f"UPDATE Blog_Posts SET {', '.join(update_fields)} WHERE Post_ID = %s"
            cursor.execute(query, params)
        
        # Update tags if provided
        if tags is not None:
            # Delete existing tags
            cursor.execute("DELETE FROM Blog_Tags WHERE Post_ID = %s", (post_id,))
            
            # Add new tags
            for tag in tags:
                cursor.execute("""
                    INSERT INTO Blog_Tags (Post_ID, Tag_Name)
                    VALUES (%s, %s)
                """, (post_id, tag))
        
        conn.commit()
        return {"message": "Blog post updated successfully"}, 200
    except Exception as e:
        conn.rollback()
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

def delete_blog_post(post_id, user_id):
    """Delete a blog post"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if post exists and belongs to user
        cursor.execute("SELECT User_ID FROM Blog_Posts WHERE Post_ID = %s", (post_id,))
        post = cursor.fetchone()
        
        if not post:
            return {"error": "Post not found"}, 404
        
        if post[0] != user_id:
            return {"error": "Unauthorized to delete this post"}, 403
        
        # Delete related records first (comments and tags)
        cursor.execute("DELETE FROM Blog_Comments WHERE Post_ID = %s", (post_id,))
        cursor.execute("DELETE FROM Blog_Tags WHERE Post_ID = %s", (post_id,))
        
        # Delete the post
        cursor.execute("DELETE FROM Blog_Posts WHERE Post_ID = %s", (post_id,))
        
        conn.commit()
        return {"message": "Blog post deleted successfully"}, 200
    except Exception as e:
        conn.rollback()
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

def add_blog_comment(post_id, user_id, content):
    """Add a comment to a blog post"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if post exists
        cursor.execute("SELECT Post_ID FROM Blog_Posts WHERE Post_ID = %s", (post_id,))
        if not cursor.fetchone():
            return {"error": "Post not found"}, 404
        
        # Add comment
        cursor.execute("""
            INSERT INTO Blog_Comments (Post_ID, User_ID, Content, Created_At)
            VALUES (%s, %s, %s, %s)
        """, (post_id, user_id, content, datetime.now()))
        
        comment_id = cursor.lastrowid
        
        conn.commit()
        return {"message": "Comment added successfully", "comment_id": comment_id}, 201
    except Exception as e:
        conn.rollback()
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

# ==================== INTERNSHIP & JOB FUNCTIONS ====================

def create_internship(user_id, title, description, tags=None, application_url=None):
    """Create a new internship listing"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Insert internship
        cursor.execute("""
            INSERT INTO Internships (User_ID, Title, Description, Application_URL, Created_At)
            VALUES (%s, %s, %s, %s, %s)
        """, (user_id, title, description, application_url, datetime.now()))
        
        internship_id = cursor.lastrowid
        
        # Add tags if provided
        if tags:
            for tag in tags:
                cursor.execute("""
                    INSERT INTO Internship_Tags (Internship_ID, Tag_Name)
                    VALUES (%s, %s)
                """, (internship_id, tag))
        
        conn.commit()
        return {"message": "Internship created successfully", "internship_id": internship_id}, 201
    except Exception as e:
        conn.rollback()
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

def get_internships(page=1, per_page=10, tag=None):
    """Get internships with pagination and optional filtering"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    offset = (page - 1) * per_page
    
    try:
        # Base query
        query = """
            SELECT i.Internship_ID, i.User_ID, i.Title, i.Description, i.Application_URL, 
                   i.Created_At, up.Full_Name as Author_Name,
                   (SELECT COUNT(*) FROM Internship_Applications WHERE Internship_ID = i.Internship_ID) as Application_Count,
                   GROUP_CONCAT(DISTINCT it.Tag_Name) as Tags
            FROM Internships i
            LEFT JOIN User_Profile up ON i.User_ID = up.User_ID
            LEFT JOIN Internship_Tags it ON i.Internship_ID = it.Internship_ID
        """
        
        # Add filters
        where_clauses = []
        params = []
        
        if tag:
            where_clauses.append("i.Internship_ID IN (SELECT Internship_ID FROM Internship_Tags WHERE Tag_Name = %s)")
            params.append(tag)
        
        if where_clauses:
            query += " WHERE " + " AND ".join(where_clauses)
        
        # Add group by, order by and limit
        query += """
            GROUP BY i.Internship_ID
            ORDER BY i.Created_At DESC
            LIMIT %s OFFSET %s
        """
        
        params.extend([per_page, offset])
        
        cursor.execute(query, params)
        internships = cursor.fetchall()
        
        # Get total count for pagination
        count_query = "SELECT COUNT(DISTINCT i.Internship_ID) as total FROM Internships i"
        if where_clauses:
            count_query += " WHERE " + " AND ".join(where_clauses)
        
        cursor.execute(count_query, params[:-2] if params else [])
        total = cursor.fetchone()['total']
        
        # Process internships to convert datetime objects to strings
        for internship in internships:
            internship['Created_At'] = internship['Created_At'].isoformat() if internship['Created_At'] else None
            internship['Tags'] = internship['Tags'].split(',') if internship['Tags'] else []
        
        return {
            "internships": internships,
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": (total + per_page - 1) // per_page
        }, 200
    except Exception as e:
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

def get_internship(internship_id):
    """Get a single internship by ID"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Get internship with author and tags
        cursor.execute("""
            SELECT i.Internship_ID, i.User_ID, i.Title, i.Description, i.Application_URL, 
                   i.Created_At, up.Full_Name as Author_Name,
                   up.Profile_Pic as Author_Profile_Pic
            FROM Internships i
            LEFT JOIN User_Profile up ON i.User_ID = up.User_ID
            WHERE i.Internship_ID = %s
        """, (internship_id,))
        
        internship = cursor.fetchone()
        
        if not internship:
            return {"error": "Internship not found"}, 404
        
        # Get tags
        cursor.execute("SELECT Tag_Name FROM Internship_Tags WHERE Internship_ID = %s", (internship_id,))
        tags = [row['Tag_Name'] for row in cursor.fetchall()]
        
        # Get applications
        cursor.execute("""
            SELECT ia.Application_ID, ia.User_ID, ia.Created_At,
                   up.Full_Name as Applicant_Name, up.Profile_Pic as Applicant_Profile_Pic
            FROM Internship_Applications ia
            LEFT JOIN User_Profile up ON ia.User_ID = up.User_ID
            WHERE ia.Internship_ID = %s
            ORDER BY ia.Created_At DESC
        """, (internship_id,))
        
        applications = cursor.fetchall()
        
        # Process datetime objects
        internship['Created_At'] = internship['Created_At'].isoformat() if internship['Created_At'] else None
        
        for application in applications:
            application['Created_At'] = application['Created_At'].isoformat() if application['Created_At'] else None
        
        internship['Tags'] = tags
        internship['Applications'] = applications
        
        return {"internship": internship}, 200
    except Exception as e:
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

def update_internship(internship_id, user_id, title=None, description=None, tags=None, application_url=None):
    """Update an existing internship listing"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if internship exists and belongs to user
        cursor.execute("SELECT User_ID FROM Internships WHERE Internship_ID = %s", (internship_id,))
        internship = cursor.fetchone()
        
        if not internship:
            return {"error": "Internship not found"}, 404
        
        if internship[0] != user_id:
            return {"error": "Unauthorized to edit this internship"}, 403
        
        # Update fields that are provided
        update_fields = []
        params = []
        
        if title is not None:
            update_fields.append("Title = %s")
            params.append(title)
        
        if description is not None:
            update_fields.append("Description = %s")
            params.append(description)
        
        if application_url is not None:
            update_fields.append("Application_URL = %s")
            params.append(application_url)
        
        update_fields.append("Updated_At = %s")
        params.append(datetime.now())
        
        # Add internship_id to params
        params.append(internship_id)
        
        # Execute update if there are fields to update
        if update_fields:
            query = f"UPDATE Internships SET {', '.join(update_fields)} WHERE Internship_ID = %s"
            cursor.execute(query, params)
        
        # Update tags if provided
        if tags is not None:
            # Delete existing tags
            cursor.execute("DELETE FROM Internship_Tags WHERE Internship_ID = %s", (internship_id,))
            
            # Add new tags
            for tag in tags:
                cursor.execute("""
                    INSERT INTO Internship_Tags (Internship_ID, Tag_Name)
                    VALUES (%s, %s)
                """, (internship_id, tag))
        
        conn.commit()
        return {"message": "Internship updated successfully"}, 200
    except Exception as e:
        conn.rollback()
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

def delete_internship(internship_id, user_id):
    """Delete an internship listing"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if internship exists and belongs to user
        cursor.execute("SELECT User_ID FROM Internships WHERE Internship_ID = %s", (internship_id,))
        internship = cursor.fetchone()
        
        if not internship:
            return {"error": "Internship not found"}, 404
        
        if internship[0] != user_id:
            return {"error": "Unauthorized to delete this internship"}, 403
        
        # Delete related records first (applications and tags)
        cursor.execute("DELETE FROM Internship_Applications WHERE Internship_ID = %s", (internship_id,))
        cursor.execute("DELETE FROM Internship_Tags WHERE Internship_ID = %s", (internship_id,))
        
        # Delete the internship
        cursor.execute("DELETE FROM Internships WHERE Internship_ID = %s", (internship_id,))
        
        conn.commit()
        return {"message": "Internship deleted successfully"}, 200
    except Exception as e:
        conn.rollback()
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

def apply_for_internship(internship_id, user_id):
    """Apply for an internship"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if internship exists
        cursor.execute("SELECT Internship_ID FROM Internships WHERE Internship_ID = %s", (internship_id,))
        if not cursor.fetchone():
            return {"error": "Internship not found"}, 404
        
        # Add application
        cursor.execute("""
            INSERT INTO Internship_Applications (Internship_ID, User_ID, Created_At)
            VALUES (%s, %s, %s)
        """, (internship_id, user_id, datetime.now()))
        
        application_id = cursor.lastrowid
        
        conn.commit()
        return {"message": "Application submitted successfully", "application_id": application_id}, 201
    except Exception as e:
        conn.rollback()
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

# ==================== QUIZ FUNCTIONS ====================
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    offset = (page - 1) * per_page
    
    try:
        # Base query
        query = """
            SELECT p.Post_ID, p.User_ID, p.Title, p.Content, 
                   p.Created_At, p.Updated_At,
                   GROUP_CONCAT(DISTINCT pt.Tag_Name) as Tags
            FROM Blog_Posts p
            LEFT JOIN Post_Tags pt ON p.Post_ID = pt.Post_ID
            WHERE 1=1
        """
        
        # Add filters
        params = []
        
        if tag:
            query += " AND p.Post_ID IN (SELECT Post_ID FROM Post_Tags WHERE Tag_Name = %s)"
            params.append(tag)
        
        # Add group by, order by and limit
        query += """
            GROUP BY p.Post_ID
            ORDER BY p.Updated_At DESC
            LIMIT %s OFFSET %s
        """
        
        params.extend([per_page, offset])
        
        cursor.execute(query, params)
        posts = cursor.fetchall()
        
        # Get total count for pagination
        count_query = "SELECT COUNT(*) as total FROM Blog_Posts p WHERE 1=1"
        count_params = []
        
        if tag:
            count_query += " AND p.Post_ID IN (SELECT Post_ID FROM Post_Tags WHERE Tag_Name = %s)"
            count_params.append(tag)
        
        cursor.execute(count_query, count_params)
        total = cursor.fetchone()['total']
        
        # Process posts
        for post in posts:
            post['Created_At'] = post['Created_At'].isoformat() if post['Created_At'] else None
            post['Updated_At'] = post['Updated_At'].isoformat() if post['Updated_At'] else None
            post['Tags'] = post['Tags'].split(',') if post['Tags'] else []
        
        return {
            "posts": posts,
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": (total + per_page - 1) // per_page
        }, 200
    except Exception as e:
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

def get_blog_post(post_id):
    """Get a single blog post by ID"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Get post
        cursor.execute("""
            SELECT p.Post_ID, p.User_ID, p.Title, p.Content, 
                   p.Created_At, p.Updated_At
            FROM Blog_Posts p
            WHERE p.Post_ID = %s
        """, (post_id,))
        
        post = cursor.fetchone()
        
        if not post:
            return {"error": "Blog post not found"}, 404
        
        # Get tags
        cursor.execute("SELECT Tag_Name FROM Post_Tags WHERE Post_ID = %s", (post_id,))
        tags = [row['Tag_Name'] for row in cursor.fetchall()]
        
        # Process datetime objects
        post['Created_At'] = post['Created_At'].isoformat() if post['Created_At'] else None
        post['Updated_At'] = post['Updated_At'].isoformat() if post['Updated_At'] else None
        post['Tags'] = tags
        
        return {"post": post}, 200
    except Exception as e:
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

def update_blog_post(post_id, user_id, title=None, content=None, tags=None):
    """Update an existing blog post"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if post exists and belongs to user
        cursor.execute("SELECT User_ID FROM Blog_Posts WHERE Post_ID = %s", (post_id,))
        post = cursor.fetchone()
        
        if not post:
            return {"error": "Blog post not found"}, 404
        
        if post[0] != user_id:
            return {"error": "Unauthorized to edit this blog post"}, 403
        
        # Update fields that are provided
        update_fields = []
        params = []
        
        if title is not None:
            update_fields.append("Title = %s")
            params.append(title)
        
        if content is not None:
            update_fields.append("Content = %s")
            params.append(content)
        
        update_fields.append("Updated_At = %s")
        params.append(datetime.now())
        
        # Add post_id to params
        params.append(post_id)
        
        # Execute update if there are fields to update
        if update_fields:
            query = f"UPDATE Blog_Posts SET {', '.join(update_fields)} WHERE Post_ID = %s"
            cursor.execute(query, params)
        
        # Update tags if provided
        if tags is not None:
            # Delete existing tags
            cursor.execute("DELETE FROM Post_Tags WHERE Post_ID = %s", (post_id,))
            
            # Add new tags
            for tag in tags:
                cursor.execute("""
                    INSERT INTO Post_Tags (Post_ID, Tag_Name)
                    VALUES (%s, %s)
                """, (post_id, tag))
        
        conn.commit()
        return {"message": "Blog post updated successfully"}, 200
    except Exception as e:
        conn.rollback()
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

def delete_blog_post(post_id, user_id):
    """Delete a blog post"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if post exists and belongs to user
        cursor.execute("SELECT User_ID FROM Blog_Posts WHERE Post_ID = %s", (post_id,))
        post = cursor.fetchone()
        
        if not post:
            return {"error": "Blog post not found"}, 404
        
        if post[0] != user_id:
            return {"error": "Unauthorized to delete this blog post"}, 403
        
        # Delete related records first (tags)
        cursor.execute("DELETE FROM Post_Tags WHERE Post_ID = %s", (post_id,))
        
        # Delete the post
        cursor.execute("DELETE FROM Blog_Posts WHERE Post_ID = %s", (post_id,))
        
        conn.commit()
        return {"message": "Blog post deleted successfully"}, 200
    except Exception as e:
        conn.rollback()
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

# ==================== RESEARCH PAPER FUNCTIONS ====================

def upload_research_paper(user_id, title, abstract, authors, file_url, publication_date=None, 
                          journal=None, keywords=None, doi=None):
    """Upload a new research paper"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Insert research paper
        cursor.execute("""
            INSERT INTO Research_Papers (
                User_ID, Title, Abstract, Authors, File_URL, 
                Publication_Date, Journal, DOI, Uploaded_At
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            user_id, title, abstract, json.dumps(authors), file_url,
            publication_date, journal, doi, datetime.now()
        ))
        
        paper_id = cursor.lastrowid
        
        # Add keywords if provided
        if keywords:
            for keyword in keywords:
                cursor.execute("""
                    INSERT INTO Paper_Keywords (Paper_ID, Keyword)
                    VALUES (%s, %s)
                """, (paper_id, keyword))
        
        conn.commit()
        return {"message": "Research paper uploaded successfully", "paper_id": paper_id}, 201
    except Exception as e:
        conn.rollback()
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

def get_research_papers(page=1, per_page=10, keyword=None, user_id=None):
    """Get research papers with pagination and optional filtering"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    offset = (page - 1) * per_page
    
    try:
        # Base query
        query = """
            SELECT rp.Paper_ID, rp.User_ID, rp.Title, rp.Abstract, rp.Authors,
                   rp.File_URL, rp.Publication_Date, rp.Journal, rp.DOI, 
                   rp.Uploaded_At, rp.Downloads, up.Full_Name as Uploader_Name,
                   GROUP_CONCAT(DISTINCT pk.Keyword) as Keywords
            FROM Research_Papers rp
            LEFT JOIN User_Profile up ON rp.User_ID = up.User_ID
            LEFT JOIN Paper_Keywords pk ON rp.Paper_ID = pk.Paper_ID
        """
        
        # Add filters
        where_clauses = []
        params = []
        
        if user_id:
            where_clauses.append("rp.User_ID = %s")
            params.append(user_id)
        
        if keyword:
            where_clauses.append("rp.Paper_ID IN (SELECT Paper_ID FROM Paper_Keywords WHERE Keyword = %s)")
            params.append(keyword)
        
        if where_clauses:
            query += " WHERE " + " AND ".join(where_clauses)
        
        # Add group by, order by and limit
        query += """
            GROUP BY rp.Paper_ID
            ORDER BY rp.Uploaded_At DESC
            LIMIT %s OFFSET %s
        """
        
        params.extend([per_page, offset])
        
        cursor.execute(query, params)
        papers = cursor.fetchall()
        
        # Get total count for pagination
        count_query = "SELECT COUNT(DISTINCT rp.Paper_ID) as total FROM Research_Papers rp"
        if where_clauses:
            count_query += " WHERE " + " AND ".join(where_clauses)
        
        cursor.execute(count_query, params[:-2] if params else [])
        total = cursor.fetchone()['total']
        
        # Process papers
        for paper in papers:
            paper['Uploaded_At'] = paper['Uploaded_At'].isoformat() if paper['Uploaded_At'] else None
            paper['Publication_Date'] = paper['Publication_Date'].isoformat() if paper['Publication_Date'] else None
            paper['Authors'] = json.loads(paper['Authors']) if paper['Authors'] else []
            paper['Keywords'] = paper['Keywords'].split(',') if paper['Keywords'] else []
        
        return {
            "papers": papers,
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": (total + per_page - 1) // per_page
        }, 200
    except Exception as e:
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

def get_research_paper(paper_id):
    """Get a single research paper by ID"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Increment download count
        cursor.execute("UPDATE Research_Papers SET Downloads = Downloads + 1 WHERE Paper_ID = %s", (paper_id,))
        
        # Get paper with uploader info
        cursor.execute("""
            SELECT rp.Paper_ID, rp.User_ID, rp.Title, rp.Abstract, rp.Authors,
                   rp.File_URL, rp.Publication_Date, rp.Journal, rp.DOI, 
                   rp.Uploaded_At, rp.Downloads, up.Full_Name as Uploader_Name,
                   up.Profile_Pic as Uploader_Profile_Pic
            FROM Research_Papers rp
            LEFT JOIN User_Profile up ON rp.User_ID = up.User_ID
            WHERE rp.Paper_ID = %s
        """, (paper_id,))
        
        paper = cursor.fetchone()
        
        if not paper:
            return {"error": "Paper not found"}, 404
        
        # Get keywords
        cursor.execute("SELECT Keyword FROM Paper_Keywords WHERE Paper_ID = %s", (paper_id,))
        keywords = [row['Keyword'] for row in cursor.fetchall()]
        
        # Process datetime objects and JSON
        paper['Uploaded_At'] = paper['Uploaded_At'].isoformat() if paper['Uploaded_At'] else None
        paper['Publication_Date'] = paper['Publication_Date'].isoformat() if paper['Publication_Date'] else None
        paper['Authors'] = json.loads(paper['Authors']) if paper['Authors'] else []
        paper['Keywords'] = keywords
        
        conn.commit()  # Commit the download count update
        return {"paper": paper}, 200
    except Exception as e:
        conn.rollback()
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

def update_research_paper(paper_id, user_id, title=None, abstract=None, authors=None, 
                          file_url=None, publication_date=None, journal=None, 
                          keywords=None, doi=None):
    """Update an existing research paper"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if paper exists and belongs to user
        cursor.execute("SELECT User_ID FROM Research_Papers WHERE Paper_ID = %s", (paper_id,))
        paper = cursor.fetchone()
        
        if not paper:
            return {"error": "Paper not found"}, 404
        
        if paper[0] != user_id:
            return {"error": "Unauthorized to edit this paper"}, 403
        
        # Update fields that are provided
        update_fields = []
        params = []
        
        if title is not None:
            update_fields.append("Title = %s")
            params.append(title)
        
        if abstract is not None:
            update_fields.append("Abstract = %s")
            params.append(abstract)
        
        if authors is not None:
            update_fields.append("Authors = %s")
            params.append(json.dumps(authors))
        
        if file_url is not None:
            update_fields.append("File_URL = %s")
            params.append(file_url)
        
        if publication_date is not None:
            update_fields.append("Publication_Date = %s")
            params.append(publication_date)
        
        if journal is not None:
            update_fields.append("Journal = %s")
            params.append(journal)
        
        if doi is not None:
            update_fields.append("DOI = %s")
            params.append(doi)
        
        # Add paper_id to params
        params.append(paper_id)
        
        # Execute update if there are fields to update
        if update_fields:
            query = f"UPDATE Research_Papers SET {', '.join(update_fields)} WHERE Paper_ID = %s"
            cursor.execute(query, params)
        
        # Update keywords if provided
        if keywords is not None:
            # Delete existing keywords
            cursor.execute("DELETE FROM Paper_Keywords WHERE Paper_ID = %s", (paper_id,))
            
            # Add new keywords
            for keyword in keywords:
                cursor.execute("""
                    INSERT INTO Paper_Keywords (Paper_ID, Keyword)
                    VALUES (%s, %s)
                """, (paper_id, keyword))
        
        conn.commit()
        return {"message": "Research paper updated successfully"}, 200
    except Exception as e:
        conn.rollback()
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

def delete_research_paper(paper_id, user_id):
    """Delete a research paper"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if paper exists and belongs to user
        cursor.execute("SELECT User_ID FROM Research_Papers WHERE Paper_ID = %s", (paper_id,))
        paper = cursor.fetchone()
        
        if not paper:
            return {"error": "Paper not found"}, 404
        
        if paper[0] != user_id:
            return {"error": "Unauthorized to delete this paper"}, 403
        
        # Delete related records first (keywords)
        cursor.execute("DELETE FROM Paper_Keywords WHERE Paper_ID = %s", (paper_id,))
        
        # Delete the paper
        cursor.execute("DELETE FROM Research_Papers WHERE Paper_ID = %s", (paper_id,))
        
        conn.commit()
        return {"message": "Research paper deleted successfully"}, 200
    except Exception as e:
        conn.rollback()
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

# ==================== NOTES FUNCTIONS ====================

def create_note(user_id, title, content, category=None, tags=None):
    """Create a new note"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Insert note
        cursor.execute("""
            INSERT INTO Notes (User_ID, Title, Content, Category, Created_At, Updated_At)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (user_id, title, content, category, datetime.now(), datetime.now()))
        
        note_id = cursor.lastrowid
        
        # Add tags if provided
        if tags:
            for tag in tags:
                cursor.execute("""
                    INSERT INTO Note_Tags (Note_ID, Tag_Name)
                    VALUES (%s, %s)
                """, (note_id, tag))
        
        conn.commit()
        return {"message": "Note created successfully", "note_id": note_id}, 201
    except Exception as e:
        conn.rollback()
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

def get_notes(user_id, page=1, per_page=20, category=None, tag=None):
    """Get notes for a user with pagination and optional filtering"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    offset = (page - 1) * per_page
    
    try:
        # Base query
        query = """
            SELECT n.Note_ID, n.Title, n.Content, n.Category, 
                   n.Created_At, n.Updated_At,
                   GROUP_CONCAT(DISTINCT nt.Tag_Name) as Tags
            FROM Notes n
            LEFT JOIN Note_Tags nt ON n.Note_ID = nt.Note_ID
            WHERE n.User_ID = %s
        """
        
        # Add filters
        params = [user_id]
        
        if category:
            query += " AND n.Category = %s"
            params.append(category)
        
        if tag:
            query += " AND n.Note_ID IN (SELECT Note_ID FROM Note_Tags WHERE Tag_Name = %s)"
            params.append(tag)
        
        # Add group by, order by and limit
        query += """
            GROUP BY n.Note_ID
            ORDER BY n.Updated_At DESC
            LIMIT %s OFFSET %s
        """
        
        params.extend([per_page, offset])
        
        cursor.execute(query, params)
        notes = cursor.fetchall()
        
        # Get total count for pagination
        count_query = "SELECT COUNT(*) as total FROM Notes n WHERE n.User_ID = %s"
        count_params = [user_id]
        
        if category:
            count_query += " AND n.Category = %s"
            count_params.append(category)
        
        if tag:
            count_query += " AND n.Note_ID IN (SELECT Note_ID FROM Note_Tags WHERE Tag_Name = %s)"
            count_params.append(tag)
        
        cursor.execute(count_query, count_params)
        total = cursor.fetchone()['total']
        
        # Process notes
        for note in notes:
            note['Created_At'] = note['Created_At'].isoformat() if note['Created_At'] else None
            note['Updated_At'] = note['Updated_At'].isoformat() if note['Updated_At'] else None
            note['Tags'] = note['Tags'].split(',') if note['Tags'] else []
        
        return {
            "notes": notes,
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": (total + per_page - 1) // per_page
        }, 200
    except Exception as e:
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

def get_note(note_id, user_id):
    """Get a single note by ID"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Get note
        cursor.execute("""
            SELECT n.Note_ID, n.Title, n.Content, n.Category, 
                   n.Created_At, n.Updated_At
            FROM Notes n
            WHERE n.Note_ID = %s AND n.User_ID = %s
        """, (note_id, user_id))
        
        note = cursor.fetchone()
        
        if not note:
            return {"error": "Note not found or unauthorized"}, 404
        
        # Get tags
        cursor.execute("SELECT Tag_Name FROM Note_Tags WHERE Note_ID = %s", (note_id,))
        tags = [row['Tag_Name'] for row in cursor.fetchall()]
        
        # Process datetime objects
        note['Created_At'] = note['Created_At'].isoformat() if note['Created_At'] else None
        note['Updated_At'] = note['Updated_At'].isoformat() if note['Updated_At'] else None
        note['Tags'] = tags
        
        return {"note": note}, 200
    except Exception as e:
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

def update_note(note_id, user_id, title=None, content=None, category=None, tags=None):
    """Update an existing note"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if note exists and belongs to user
        cursor.execute("SELECT User_ID FROM Notes WHERE Note_ID = %s", (note_id,))
        note = cursor.fetchone()
        
        if not note:
            return {"error": "Note not found"}, 404
        
        if note[0] != user_id:
            return {"error": "Unauthorized to edit this note"}, 403
        
        # Update fields that are provided
        update_fields = []
        params = []
        
        if title is not None:
            update_fields.append("Title = %s")
            params.append(title)
        
        if content is not None:
            update_fields.append("Content = %s")
            params.append(content)
        
        if category is not None:
            update_fields.append("Category = %s")
            params.append(category)
        
        update_fields.append("Updated_At = %s")
        params.append(datetime.now())
        
        # Add note_id to params
        params.append(note_id)
        
        # Execute update if there are fields to update
        if update_fields:
            query = f"UPDATE Notes SET {', '.join(update_fields)} WHERE Note_ID = %s"
            cursor.execute(query, params)
        
        # Update tags if provided
        if tags is not None:
            # Delete existing tags
            cursor.execute("DELETE FROM Note_Tags WHERE Note_ID = %s", (note_id,))
            
            # Add new tags
            for tag in tags:
                cursor.execute("""
                    INSERT INTO Note_Tags (Note_ID, Tag_Name)
                    VALUES (%s, %s)
                """, (note_id, tag))
        
        conn.commit()
        return {"message": "Note updated successfully"}, 200
    except Exception as e:
        conn.rollback()
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

def delete_note(note_id, user_id):
    """Delete a note"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if note exists and belongs to user
        cursor.execute("SELECT User_ID FROM Notes WHERE Note_ID = %s", (note_id,))
        note = cursor.fetchone()
        
        if not note:
            return {"error": "Note not found"}, 404
        
        if note[0] != user_id:
            return {"error": "Unauthorized to delete this note"}, 403
        
        # Delete related records first (tags)
        cursor.execute("DELETE FROM Note_Tags WHERE Note_ID = %s", (note_id,))
        
        # Delete the note
        cursor.execute("DELETE FROM Notes WHERE Note_ID = %s", (note_id,))
        
        conn.commit()
        return {"message": "Note deleted successfully"}, 200
    except Exception as e:
        conn.rollback()
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

# ==================== INTERNSHIP & JOB FUNCTIONS ====================

def post_job_listing(user_id, title, company, description, location, job_type, 
                     application_url=None, salary_range=None, requirements=None, 
                     is_internship=False, deadline=None):
    """Post a new job or internship listing"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Insert job listing
        cursor.execute("""
            INSERT INTO Job_Listings (
                User_ID, Title, Company, Description, Location, Job_Type,
                Application_URL, Salary_Range, Requirements, Is_Internship,
                Deadline, Posted_At
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            user_id, title, company, description, location, job_type,
            application_url, salary_range, json.dumps(requirements) if requirements else None,
            is_internship, deadline, datetime.now()
        ))
        
        job_id = cursor.lastrowid
        
        conn.commit()
        return {"message": "Job listing posted successfully", "job_id": job_id}, 201
    except Exception as e:
        conn.rollback()
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

def get_job_listings(page=1, per_page=10, is_internship=None, location=None, job_type=None):
    """Get job listings with pagination and optional filtering"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    offset = (page - 1) * per_page
    
    try:
        # Base query
        query = """
            SELECT j.Job_ID, j.User_ID, j.Title, j.Company, j.Description, 
                   j.Location, j.Job_Type, j.Application_URL, j.Salary_Range,
                   j.Requirements, j.Is_Internship, j.Deadline, j.Posted_At,
                   j.Views, up.Full_Name as Posted_By_Name
            FROM Job_Listings j
            LEFT JOIN User_Profile up ON j.User_ID = up.User_ID
            WHERE 1=1
        """
        
        # Add filters
        params = []
        
        if is_internship is not None:
            query += " AND j.Is_Internship = %s"
            params.append(is_internship)
        
        if location:
            query += " AND j.Location LIKE %s"
            params.append(f"%{location}%")
        
        if job_type:
            query += " AND j.Job_Type = %s"
            params.append(job_type)
        
        # Add order by and limit
        query += """
            ORDER BY j.Posted_At DESC
            LIMIT %s OFFSET %s
        """
        
        params.extend([per_page, offset])
        
        cursor.execute(query, params)
        jobs = cursor.fetchall()
        
        # Get total count for pagination
        count_query = "SELECT COUNT(*) as total FROM Job_Listings j WHERE 1=1"
        count_params = []
        
        if is_internship is not None:
            count_query += " AND j.Is_Internship = %s"
            count_params.append(is_internship)
        
        if location:
            count_query += " AND j.Location LIKE %s"
            count_params.append(f"%{location}%")
        
        if job_type:
            count_query += " AND j.Job_Type = %s"
            count_params.append(job_type)
        
        cursor.execute(count_query, count_params)
        total = cursor.fetchone()['total']
        
        # Process jobs
        for job in jobs:
            job['Posted_At'] = job['Posted_At'].isoformat() if job['Posted_At'] else None
            job['Deadline'] = job['Deadline'].isoformat() if job['Deadline'] else None
            job['Requirements'] = json.loads(job['Requirements']) if job['Requirements'] else []
        
        return {
            "jobs": jobs,
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": (total + per_page - 1) // per_page
        }, 200
    except Exception as e:
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

def get_job_listing(job_id):
    """Get a single job listing by ID"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Increment view count
        cursor.execute("UPDATE Job_Listings SET Views = Views + 1 WHERE Job_ID = %s", (job_id,))
        
        # Get job with poster info
        cursor.execute("""
            SELECT j.Job_ID, j.User_ID, j.Title, j.Company, j.Description, 
                   j.Location, j.Job_Type, j.Application_URL, j.Salary_Range,
                   j.Requirements, j.Is_Internship, j.Deadline, j.Posted_At,
                   j.Views, up.Full_Name as Posted_By_Name,
                   up.Profile_Pic as Posted_By_Profile_Pic
            FROM Job_Listings j
            LEFT JOIN User_Profile up ON j.User_ID = up.User_ID
            WHERE j.Job_ID = %s
        """, (job_id,))
        
        job = cursor.fetchone()
        
        if not job:
            return {"error": "Job listing not found"}, 404
        
        # Process datetime objects and JSON
        job['Posted_At'] = job['Posted_At'].isoformat() if job['Posted_At'] else None
        job['Deadline'] = job['Deadline'].isoformat() if job['Deadline'] else None
        job['Requirements'] = json.loads(job['Requirements']) if job['Requirements'] else []
        
        conn.commit()  # Commit the view count update
        return {"job": job}, 200
    except Exception as e:
        conn.rollback()
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

def update_job_listing(job_id, user_id, title=None, company=None, description=None, 
                       location=None, job_type=None, application_url=None, 
                       salary_range=None, requirements=None, is_internship=None, deadline=None):
    """Update an existing job listing"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if job exists and belongs to user
        cursor.execute("SELECT User_ID FROM Job_Listings WHERE Job_ID = %s", (job_id,))
        job = cursor.fetchone()
        
        if not job:
            return {"error": "Job listing not found"}, 404
        
        if job[0] != user_id:
            return {"error": "Unauthorized to edit this job listing"}, 403
        
        # Update fields that are provided
        update_fields = []
        params = []
        
        if title is not None:
            update_fields.append("Title = %s")
            params.append(title)
        
        if company is not None:
            update_fields.append("Company = %s")
            params.append(company)
        
        if description is not None:
            update_fields.append("Description = %s")
            params.append(description)
        
        if location is not None:
            update_fields.append("Location = %s")
            params.append(location)
        
        if job_type is not None:
            update_fields.append("Job_Type = %s")
            params.append(job_type)
        
        if application_url is not None:
            update_fields.append("Application_URL = %s")
            params.append(application_url)
        
        if salary_range is not None:
            update_fields.append("Salary_Range = %s")
            params.append(salary_range)
        
        if requirements is not None:
            update_fields.append("Requirements = %s")
            params.append(json.dumps(requirements))
        
        if is_internship is not None:
            update_fields.append("Is_Internship = %s")
            params.append(is_internship)
        
        if deadline is not None:
            update_fields.append("Deadline = %s")
            params.append(deadline)
        
        # Add job_id to params
        params.append(job_id)
        
        # Execute update if there are fields to update
        if update_fields:
            query = f"UPDATE Job_Listings SET {', '.join(update_fields)} WHERE Job_ID = %s"
            cursor.execute(query, params)
        
        conn.commit()
        return {"message": "Job listing updated successfully"}, 200
    except Exception as e:
        conn.rollback()
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

def delete_job_listing(job_id, user_id):
    """Delete a job listing"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if job exists and belongs to user
        cursor.execute("SELECT User_ID FROM Job_Listings WHERE Job_ID = %s", (job_id,))
        job = cursor.fetchone()
        
        if not job:
            return {"error": "Job listing not found"}, 404
        
        if job[0] != user_id:
            return {"error": "Unauthorized to delete this job listing"}, 403
        
        # Delete the job listing
        cursor.execute("DELETE FROM Job_Listings WHERE Job_ID = %s", (job_id,))
        
        conn.commit()
        return {"message": "Job listing deleted successfully"}, 200
    except Exception as e:
        conn.rollback()
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

def apply_for_job(job_id, user_id, cover_letter=None, resume_url=None):
    """Apply for a job or internship"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if job exists
        cursor.execute("SELECT Job_ID FROM Job_Listings WHERE Job_ID = %s", (job_id,))
        if not cursor.fetchone():
            return {"error": "Job listing not found"}, 404
        
        # Check if already applied
        cursor.execute("""
            SELECT Application_ID FROM Job_Applications 
            WHERE Job_ID = %s AND User_ID = %s
        """, (job_id, user_id))
        
        if cursor.fetchone():
            return {"error": "You have already applied for this position"}, 400
        
        # Insert application
        cursor.execute("""
            INSERT INTO Job_Applications (
                Job_ID, User_ID, Cover_Letter, Resume_URL, Applied_At, Status
            )
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            job_id, user_id, cover_letter, resume_url, datetime.now(), 'Pending'
        ))
        
        application_id = cursor.lastrowid
        
        conn.commit()
        return {"message": "Application submitted successfully", "application_id": application_id}, 201
    except Exception as e:
        conn.rollback()
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

def get_job_applications(user_id=None, job_id=None, status=None, page=1, per_page=20):
    """Get job applications with optional filtering"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    offset = (page - 1) * per_page
    
    try:
        # Base query
        query = """
            SELECT ja.Application_ID, ja.Job_ID, ja.User_ID, ja.Cover_Letter,
                   ja.Resume_URL, ja.Applied_At, ja.Status, ja.Feedback,
                   j.Title as Job_Title, j.Company, j.Is_Internship,
                   up.Full_Name as Applicant_Name, up.Profile_Pic as Applicant_Profile_Pic
            FROM Job_Applications ja
            JOIN Job_Listings j ON ja.Job_ID = j.Job_ID
            JOIN User_Profile up ON ja.User_ID = up.User_ID
            WHERE 1=1
        """
        
        # Add filters
        params = []
        
        if user_id:
            query += " AND ja.User_ID = %s"
            params.append(user_id)
        
        if job_id:
            query += " AND ja.Job_ID = %s"
            params.append(job_id)
        
        if status:
            query += " AND ja.Status = %s"
            params.append(status)
        
        # Add order by and limit
        query += """
            ORDER BY ja.Applied_At DESC
            LIMIT %s OFFSET %s
        """
        
        params.extend([per_page, offset])
        
        cursor.execute(query, params)
        applications = cursor.fetchall()
        
        # Get total count for pagination
        count_query = "SELECT COUNT(*) as total FROM Job_Applications ja WHERE 1=1"
        count_params = []
        
        if user_id:
            count_query += " AND ja.User_ID = %s"
            count_params.append(user_id)
        
        if job_id:
            count_query += " AND ja.Job_ID = %s"
            count_params.append(job_id)
        
        if status:
            count_query += " AND ja.Status = %s"
            count_params.append(status)
        
        cursor.execute(count_query, count_params)
        total = cursor.fetchone()['total']
        
        # Process applications
        for app in applications:
            app['Applied_At'] = app['Applied_At'].isoformat() if app['Applied_At'] else None
        
        return {
            "applications": applications,
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": (total + per_page - 1) // per_page
        }, 200
    except Exception as e:
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

def update_application_status(application_id, job_poster_id, status, feedback=None):
    """Update the status of a job application (for job posters)"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if application exists and user is the job poster
        cursor.execute("""
            SELECT j.User_ID 
            FROM Job_Applications ja
            JOIN Job_Listings j ON ja.Job_ID = j.Job_ID
            WHERE ja.Application_ID = %s
        """, (application_id,))
        
        result = cursor.fetchone()
        
        if not result:
            return {"error": "Application not found"}, 404
        
        if result[0] != job_poster_id:
            return {"error": "Unauthorized to update this application"}, 403
        
        # Update application status
        cursor.execute("""
            UPDATE Job_Applications 
            SET Status = %s, Feedback = %s
            WHERE Application_ID = %s
        """, (status, feedback, application_id))
        
        conn.commit()
        return {"message": f"Application status updated to {status}"}, 200
    except Exception as e:
        conn.rollback()
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

# ==================== COURSE & LEARNING FUNCTIONS ====================

def create_course(instructor_id, title, description, difficulty_level, 
                  duration_hours, image_url=None, price=None, syllabus=None):
    """Create a new course"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Insert course
        cursor.execute("""
            INSERT INTO Courses (
                Instructor_ID, Title, Description, Difficulty_Level,
                Duration_Hours, Image_URL, Price, Syllabus, Created_At
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            instructor_id, title, description, difficulty_level,
            duration_hours, image_url, price, 
            json.dumps(syllabus) if syllabus else None,
            datetime.now()
        ))
        
        course_id = cursor.lastrowid
        
        conn.commit()
        return {"message": "Course created successfully", "course_id": course_id}, 201
    except Exception as e:
        conn.rollback()
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

def add_course_module(course_id, instructor_id, title, content, order_num, 
                      video_url=None, resources=None):
    """Add a module to a course"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if course exists and belongs to instructor
        cursor.execute("SELECT Instructor_ID FROM Courses WHERE Course_ID = %s", (course_id,))
        course = cursor.fetchone()
        
        if not course:
            return {"error": "Course not found"}, 404
        
        if course[0] != instructor_id:
            return {"error": "Unauthorized to modify this course"}, 403
        
        # Insert module
        cursor.execute("""
            INSERT INTO Course_Modules (
                Course_ID, Title, Content, Order_Num, Video_URL, Resources
            )
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            course_id, title, content, order_num, video_url,
            json.dumps(resources) if resources else None
        ))
        
        module_id = cursor.lastrowid
        
        conn.commit()
        return {"message": "Module added successfully", "module_id": module_id}, 201
    except Exception as e:
        conn.rollback()
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

def get_courses(page=1, per_page=10, difficulty=None, instructor_id=None):
    """Get courses with pagination and optional filtering"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    offset = (page - 1) * per_page
    
    try:
        # Base query
        query = """
            SELECT c.Course_ID, c.Instructor_ID, c.Title, c.Description, 
                   c.Difficulty_Level, c.Duration_Hours, c.Image_URL, c.Price,
                   c.Created_At, c.Enrollments, c.Rating,
                   up.Full_Name as Instructor_Name, up.Profile_Pic as Instructor_Profile_Pic,
                   (SELECT COUNT(*) FROM Course_Modules WHERE Course_ID = c.Course_ID) as Module_Count
            FROM Courses c
            LEFT JOIN User_Profile up ON c.Instructor_ID = up.User_ID
            WHERE 1=1
        """
        
        # Add filters
        params = []
        
        if difficulty:
            query += " AND c.Difficulty_Level = %s"
            params.append(difficulty)
        
        if instructor_id:
            query += " AND c.Instructor_ID = %s"
            params.append(instructor_id)
        
        # Add order by and limit
        query += """
            ORDER BY c.Created_At DESC
            LIMIT %s OFFSET %s
        """
        
        params.extend([per_page, offset])
        
        cursor.execute(query, params)
        courses = cursor.fetchall()
        
        # Get total count for pagination
        count_query = "SELECT COUNT(*) as total FROM Courses c WHERE 1=1"
        count_params = []
        
        if difficulty:
            count_query += " AND c.Difficulty_Level = %s"
            count_params.append(difficulty)
        
        if instructor_id:
            count_query += " AND c.Instructor_ID = %s"
            count_params.append(instructor_id)
        
        cursor.execute(count_query, count_params)
        total = cursor.fetchone()['total']
        
        # Process courses
        for course in courses:
            course['Created_At'] = course['Created_At'].isoformat() if course['Created_At'] else None
        
        return {
            "courses": courses,
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": (total + per_page - 1) // per_page
        }, 200
    except Exception as e:
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

def get_course(course_id, user_id=None):
    """Get a single course by ID with modules"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Get course with instructor info
        cursor.execute("""
            SELECT c.Course_ID, c.Instructor_ID, c.Title, c.Description, 
                   c.Difficulty_Level, c.Duration_Hours, c.Image_URL, c.Price,
                   c.Syllabus, c.Created_At, c.Enrollments, c.Rating,
                   up.Full_Name as Instructor_Name, up.Profile_Pic as Instructor_Profile_Pic
            FROM Courses c
            LEFT JOIN User_Profile up ON c.Instructor_ID = up.User_ID
            WHERE c.Course_ID = %s
        """, (course_id,))
        
        course = cursor.fetchone()
        
        if not course:
            return {"error": "Course not found"}, 404
        
        # Get modules
        cursor.execute("""
            SELECT Module_ID, Title, Content, Order_Num, Video_URL, Resources
            FROM Course_Modules
            WHERE Course_ID = %s
            ORDER BY Order_Num
        """, (course_id,))
        
        modules = cursor.fetchall()
        
        # Check if user is enrolled
        is_enrolled = False
        if user_id:
            cursor.execute("""
                SELECT Enrollment_ID FROM Course_Enrollments
                WHERE Course_ID = %s AND User_ID = %s
            """, (course_id, user_id))
            
            is_enrolled = cursor.fetchone() is not None
        
        # Process datetime objects and JSON
        course['Created_At'] = course['Created_At'].isoformat() if course['Created_At'] else None
        course['Syllabus'] = json.loads(course['Syllabus']) if course['Syllabus'] else []
        
        for module in modules:
            module['Resources'] = json.loads(module['Resources']) if module['Resources'] else []
        
        # Add modules to course
        course['Modules'] = modules if is_enrolled or course['Instructor_ID'] == user_id else []
        course['Is_Enrolled'] = is_enrolled
        
        return {"course": course}, 200
    except Exception as e:
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

def enroll_in_course(course_id, user_id):
    """Enroll a user in a course"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if course exists
        cursor.execute("SELECT Course_ID, Price FROM Courses WHERE Course_ID = %s", (course_id,))
        course = cursor.fetchone()
        
        if not course:
            return {"error": "Course not found"}, 404
        
        # Check if already enrolled
        cursor.execute("""
            SELECT Enrollment_ID FROM Course_Enrollments
            WHERE Course_ID = %s AND User_ID = %s
        """, (course_id, user_id))
        
        if cursor.fetchone():
            return {"error": "Already enrolled in this course"}, 400
        
        # Insert enrollment
        cursor.execute("""
            INSERT INTO Course_Enrollments (
                Course_ID, User_ID, Enrolled_At, Progress, Last_Activity
            )
            VALUES (%s, %s, %s, %s, %s)
        """, (
            course_id, user_id, datetime.now(), 0, datetime.now()
        ))
        
        # Update course enrollment count
        cursor.execute("""
            UPDATE Courses SET Enrollments = Enrollments + 1
            WHERE Course_ID = %s
        """, (course_id,))
        
        conn.commit()
        return {"message": "Successfully enrolled in course"}, 201
    except Exception as e:
        conn.rollback()
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

def update_course_progress(course_id, user_id, progress, completed_modules=None):
    """Update a user's progress in a course"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if enrolled
        cursor.execute("""
            SELECT Enrollment_ID FROM Course_Enrollments
            WHERE Course_ID = %s AND User_ID = %s
        """, (course_id, user_id))
        
        enrollment = cursor.fetchone()
        if not enrollment:
            return {"error": "Not enrolled in this course"}, 404
        
        # Update progress
        cursor.execute("""
            UPDATE Course_Enrollments
            SET Progress = %s, Last_Activity = %s
            WHERE Course_ID = %s AND User_ID = %s
        """, (progress, datetime.now(), course_id, user_id))
        
        # Update completed modules if provided
        if completed_modules:
            for module_id in completed_modules:
                # Check if already marked as completed
                cursor.execute("""
                    SELECT * FROM Module_Completion
                    WHERE Module_ID = %s AND User_ID = %s
                """, (module_id, user_id))
                
                if not cursor.fetchone():
                    cursor.execute("""
                        INSERT INTO Module_Completion (
                            Module_ID, User_ID, Completed_At
                        )
                        VALUES (%s, %s, %s)
                    """, (module_id, user_id, datetime.now()))
        
        conn.commit()
        return {"message": "Course progress updated"}, 200
    except Exception as e:
        conn.rollback()
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

def rate_course(course_id, user_id, rating, review=None):
    """Rate and review a course"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if enrolled
        cursor.execute("""
            SELECT Enrollment_ID FROM Course_Enrollments
            WHERE Course_ID = %s AND User_ID = %s
        """, (course_id, user_id))
        
        if not cursor.fetchone():
            return {"error": "Must be enrolled to rate this course"}, 403
        
        # Check if already rated
        cursor.execute("""
            SELECT Rating_ID FROM Course_Ratings
            WHERE Course_ID = %s AND User_ID = %s
        """, (course_id, user_id))
        
        existing_rating = cursor.fetchone()
        
        if existing_rating:
            # Update existing rating
            cursor.execute("""
                UPDATE Course_Ratings
                SET Rating = %s, Review = %s, Updated_At = %s
                WHERE Course_ID = %s AND User_ID = %s
            """, (rating, review, datetime.now(), course_id, user_id))
        else:
            # Insert new rating
            cursor.execute("""
                INSERT INTO Course_Ratings (
                    Course_ID, User_ID, Rating, Review, Created_At
                )
                VALUES (%s, %s, %s, %s, %s)
            """, (course_id, user_id, rating, review, datetime.now()))
        
        # Update course average rating
        cursor.execute("""
            UPDATE Courses c
            SET Rating = (
                SELECT AVG(Rating) FROM Course_Ratings
                WHERE Course_ID = %s
            )
            WHERE Course_ID = %s
        """, (course_id, course_id))
        
        conn.commit()
        return {"message": "Course rated successfully"}, 200
    except Exception as e:
        conn.rollback()
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

# ==================== QUIZ FUNCTIONS ====================


def create_quiz(creator_id, title, description, time_limit_minutes=None, 
                passing_score=None, difficulty_level=None, course_id=None):
    """Create a new quiz"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Insert quiz
        cursor.execute("""
            INSERT INTO Quizzes (
                Creator_ID, Title, Description, Time_Limit_Minutes, Passing_Score, 
                Difficulty_Level, Course_ID, Created_At
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            creator_id, title, description, time_limit_minutes, passing_score, 
            difficulty_level, course_id, datetime.now()
        ))
        
        quiz_id = cursor.lastrowid
        
        conn.commit()
        return {"message": "Quiz created successfully", "quiz_id": quiz_id}, 201
    except Exception as e:
        conn.rollback()
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

def add_quiz_question(quiz_id, creator_id, question_text, question_type, 
                      options=None, correct_option=None, points=1):
    """Add a question to a quiz"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if quiz exists and belongs to creator
        cursor.execute("SELECT Creator_ID FROM Quizzes WHERE Quiz_ID = %s", (quiz_id,))
        quiz = cursor.fetchone()
        
        if not quiz:
            return {"error": "Quiz not found"}, 404
        
        if quiz[0] != creator_id:
            return {"error": "Unauthorized to modify this quiz"}, 403
        
        # Insert question
        cursor.execute("""
            INSERT INTO Quiz_Questions (
                Quiz_ID, Question_Text, Question_Type, Options, Correct_Option, Points
            )
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            quiz_id, question_text, question_type, 
            json.dumps(options) if options else None, 
            correct_option, points
        ))
        
        question_id = cursor.lastrowid
        
        conn.commit()
        return {"message": "Question added successfully", "question_id": question_id}, 201
    except Exception as e:
        conn.rollback()
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

def get_quizzes(page=1, per_page=10, creator_id=None, course_id=None, difficulty=None):
    """Get quizzes with pagination and optional filtering"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    offset = (page - 1) * per_page
    
    try:
        # Base query
        query = """
            SELECT q.Quiz_ID, q.Creator_ID, q.Title, q.Description, 
                   q.Time_Limit_Minutes, q.Passing_Score, q.Difficulty_Level,
                   q.Course_ID, q.Created_At, q.Average_Score, q.Attempts,
                   up.Full_Name as Creator_Name,
                   (SELECT COUNT(*) FROM Quiz_Questions WHERE Quiz_ID = q.Quiz_ID) as Question_Count
            FROM Quizzes q
            LEFT JOIN User_Profile up ON q.Creator_ID = up.User_ID
            WHERE 1=1
        """
        
        # Add filters
        params = []
        
        if creator_id:
            query += " AND q.Creator_ID = %s"
            params.append(creator_id)
        
        if course_id:
            query += " AND q.Course_ID = %s"
            params.append(course_id)
        
        if difficulty:
            query += " AND q.Difficulty_Level = %s"
            params.append(difficulty)
        
        # Add order by and limit
        query += """
            ORDER BY q.Created_At DESC
            LIMIT %s OFFSET %s
        """
        
        params.extend([per_page, offset])
        
        cursor.execute(query, params)
        quizzes = cursor.fetchall()
        
        # Get total count for pagination
        count_query = "SELECT COUNT(*) as total FROM Quizzes q WHERE 1=1"
        count_params = []
        
        if creator_id:
            count_query += " AND q.Creator_ID = %s"
            count_params.append(creator_id)
        
        if course_id:
            count_query += " AND q.Course_ID = %s"
            count_params.append(course_id)
        
        if difficulty:
            count_query += " AND q.Difficulty_Level = %s"
            count_params.append(difficulty)
        
        cursor.execute(count_query, count_params)
        total = cursor.fetchone()['total']
        
        # Process quizzes
        for quiz in quizzes:
            quiz['Created_At'] = quiz['Created_At'].isoformat() if quiz['Created_At'] else None
        
        return {
            "quizzes": quizzes,
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": (total + per_page - 1) // per_page
        }, 200
    except Exception as e:
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

def get_quiz(quiz_id, user_id=None, include_answers=False):
    """Get a single quiz by ID with questions"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Get quiz with creator info
        cursor.execute("""
            SELECT q.Quiz_ID, q.Creator_ID, q.Title, q.Description, 
                   q.Time_Limit_Minutes, q.Passing_Score, q.Difficulty_Level,
                   q.Course_ID, q.Created_At, q.Average_Score, q.Attempts,
                   up.Full_Name as Creator_Name
            FROM Quizzes q
            LEFT JOIN User_Profile up ON q.Creator_ID = up.User_ID
            WHERE q.Quiz_ID = %s
        """, (quiz_id,))
        
        quiz = cursor.fetchone()
        
        if not quiz:
            return {"error": "Quiz not found"}, 404
        
        # Get questions
        question_query = """
            SELECT Question_ID, Question_Text, Question_Type, Options, Points
        """
        
        # Include correct answers only for quiz creator or if explicitly requested
        if include_answers or (user_id and user_id == quiz['Creator_ID']):
            question_query += ", Correct_Option"
        
        question_query += """
            FROM Quiz_Questions
            WHERE Quiz_ID = %s
            ORDER BY Question_ID
        """
        
        cursor.execute(question_query, (quiz_id,))
        questions = cursor.fetchall()
        
        # Check if user has taken this quiz
        user_score = None
        if user_id:
            cursor.execute("""
                SELECT Score FROM Quiz_Enrollments
                WHERE Quiz_ID = %s AND User_ID = %s
            """, (quiz_id, user_id))
            
            result = cursor.fetchone()
            if result:
                user_score = result['Score']
        
        # Process datetime objects and JSON
        quiz['Created_At'] = quiz['Created_At'].isoformat() if quiz['Created_At'] else None
        
        for question in questions:
            if question['Options']:
                question['Options'] = json.loads(question['Options'])
        
        # Add questions to quiz
        quiz['Questions'] = questions
        quiz['User_Score'] = user_score
        
        return {"quiz": quiz}, 200
    except Exception as e:
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

def enroll_in_quiz(quiz_id, user_id):
    """Enroll a user in a quiz"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if quiz exists
        cursor.execute("SELECT Quiz_ID FROM Quizzes WHERE Quiz_ID = %s", (quiz_id,))
        if not cursor.fetchone():
            return {"error": "Quiz not found"}, 404
        
        # Check if already enrolled
        cursor.execute("""
            SELECT Enrollment_ID FROM Quiz_Enrollments
            WHERE Quiz_ID = %s AND User_ID = %s
        """, (quiz_id, user_id))
        
        if cursor.fetchone():
            return {"error": "Already enrolled in this quiz"}, 400
        
        # Insert enrollment
        cursor.execute("""
            INSERT INTO Quiz_Enrollments (
                Quiz_ID, User_ID, Enrolled_At, Last_Activity
            )
            VALUES (%s, %s, %s, %s)
        """, (
            quiz_id, user_id, datetime.now(), datetime.now()
        ))
        
        # Update quiz attempt count
        cursor.execute("""
            UPDATE Quizzes SET Attempts = Attempts + 1
            WHERE Quiz_ID = %s
        """, (quiz_id,))
        
        conn.commit()
        return {"message": "Successfully enrolled in quiz"}, 201
    except Exception as e:
        conn.rollback()
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

def submit_quiz(quiz_id, user_id, answers):
    """Submit answers for a quiz"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Check if enrolled
        cursor.execute("""
            SELECT Enrollment_ID FROM Quiz_Enrollments
            WHERE Quiz_ID = %s AND User_ID = %s
        """, (quiz_id, user_id))
        
        enrollment = cursor.fetchone()
        if not enrollment:
            return {"error": "Not enrolled in this quiz"}, 404
        
        # Check if already submitted
        cursor.execute("""
            SELECT * FROM Quiz_Submissions
            WHERE Quiz_ID = %s AND User_ID = %s
        """, (quiz_id, user_id))
        
        if cursor.fetchone():
            return {"error": "Quiz already submitted"}, 400
        
        # Insert submission
        cursor.execute("""
            INSERT INTO Quiz_Submissions (
                Quiz_ID, User_ID, Answers, Submitted_At
            )
            VALUES (%s, %s, %s, %s)
        """, (
            quiz_id, user_id, json.dumps(answers), datetime.now()
        ))
        
        # Get questions to calculate score
        cursor.execute("""
            SELECT Question_ID, Question_Type, Correct_Option, Points
            FROM Quiz_Questions
            WHERE Quiz_ID = %s
        """, (quiz_id,))
        
        questions = cursor.fetchall()
        score = 0
        total_points = 0
        
        for question in questions:
            total_points += question['Points']
            question_id = str(question['Question_ID'])
            
            if question_id in answers:
                if question['Question_Type'] == 'multiple_choice' or question['Question_Type'] == 'true_false':
                    if str(answers[question_id]) == str(question['Correct_Option']):
                        score += question['Points']
                elif question['Question_Type'] == 'text':
                    # For text questions, do a case-insensitive comparison
                    if str(answers[question_id]).lower() == str(question['Correct_Option']).lower():
                        score += question['Points']
        
        # Calculate percentage score
        percentage_score = (score / total_points * 100) if total_points > 0 else 0
        
        # Update enrollment with score
        cursor.execute("""
            UPDATE Quiz_Enrollments
            SET Score = %s, Last_Activity = %s
            WHERE Quiz_ID = %s AND User_ID = %s
        """, (percentage_score, datetime.now(), quiz_id, user_id))
        
        # Update quiz average score
        cursor.execute("""
            UPDATE Quizzes q
            SET Average_Score = (
                SELECT AVG(Score) FROM Quiz_Enrollments
                WHERE Quiz_ID = %s AND Score IS NOT NULL
            )
            WHERE Quiz_ID = %s
        """, (quiz_id, quiz_id))
        
        conn.commit()
        return {
            "message": "Quiz submitted successfully", 
            "score": score, 
            "total_points": total_points,
            "percentage": percentage_score
        }, 200
    except Exception as e:
        conn.rollback()
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

def get_quiz_results(user_id, quiz_id=None, page=1, per_page=20):
    """Get quiz results for a user with optional filtering"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    offset = (page - 1) * per_page
    
    try:
        # Base query
        query = """
            SELECT qe.Enrollment_ID, qe.Quiz_ID, qe.User_ID, qe.Score,
                   qe.Enrolled_At, qe.Last_Activity,
                   q.Title as Quiz_Title, q.Passing_Score,
                   q.Difficulty_Level, q.Time_Limit_Minutes
            FROM Quiz_Enrollments qe
            JOIN Quizzes q ON qe.Quiz_ID = q.Quiz_ID
            WHERE qe.User_ID = %s AND qe.Score IS NOT NULL
        """
        
        # Add filters
        params = [user_id]
        
        if quiz_id:
            query += " AND qe.Quiz_ID = %s"
            params.append(quiz_id)
        
        # Add order by and limit
        query += """
            ORDER BY qe.Last_Activity DESC
            LIMIT %s OFFSET %s
        """
        
        params.extend([per_page, offset])
        
        cursor.execute(query, params)
        results = cursor.fetchall()
        
        # Get total count for pagination
        count_query = """
            SELECT COUNT(*) as total 
            FROM Quiz_Enrollments qe
            WHERE qe.User_ID = %s AND qe.Score IS NOT NULL
        """
        count_params = [user_id]
        
        if quiz_id:
            count_query += " AND qe.Quiz_ID = %s"
            count_params.append(quiz_id)
        
        cursor.execute(count_query, count_params)
        total = cursor.fetchone()['total']
        
        # Process results
        for result in results:
            result['Enrolled_At'] = result['Enrolled_At'].isoformat() if result['Enrolled_At'] else None
            result['Last_Activity'] = result['Last_Activity'].isoformat() if result['Last_Activity'] else None
            result['Passed'] = result['Score'] >= result['Passing_Score'] if result['Passing_Score'] else None
        
        return {
            "results": results,
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": (total + per_page - 1) // per_page
        }, 200
    except Exception as e:
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

# Initialize connection pool when module is imported
connection_pool = None

def init_db_pool():
    """Initialize the database connection pool"""
    global connection_pool
    
    try:
        db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'user': os.getenv('DB_USER', 'root'),
            'password': os.getenv('DB_PASSWORD', ''),
            'database': os.getenv('DB_NAME', 'lawfort'),
            'charset': 'utf8mb4',
            'collation': 'utf8mb4_unicode_ci',
            'pool_size': int(os.getenv('DB_POOL_SIZE', 5))
        }
        
        connection_pool = pooling.MySQLConnectionPool(
            pool_name="lawfort_pool",
            pool_size=db_config['pool_size'],
            **db_config
        )
        
        print(f"Database connection pool initialized with size {db_config['pool_size']}")
        return True
    except Exception as e:
        print(f"Error initializing database connection pool: {e}")
        return False
        if difficulty_level:
            query += " AND q.Difficulty_Level = %s"
            params.append(difficulty_level)
        
        # Add order by and limit
        query += """
            ORDER BY q.Created_At DESC
            LIMIT %s OFFSET %s
        """
        
        params.extend([per_page, offset])
        
        cursor.execute(query, params)
        quizzes = cursor.fetchall()
        
        # Get total count for pagination
        count_query = "SELECT COUNT(*) as total FROM Quizzes q WHERE 1=1"
        count_params = []
        
        if course_id:
            count_query += " AND q.Course_ID = %s"
            count_params.append(course_id)
        
        if difficulty_level:
            count_query += " AND q.Difficulty_Level = %s"
            count_params.append(difficulty_level)
        
        cursor.execute(count_query, count_params)
        total = cursor.fetchone()['total']
        
        # Process quizzes
        for quiz in quizzes:
            quiz['Created_At'] = quiz['Created_At'].isoformat() if quiz['Created_At'] else None
        
        return {
            "quizzes": quizzes,
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": (total + per_page - 1) // per_page
        }, 200
    except Exception as e:
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

def get_quiz(quiz_id, user_id=None):
    """Get a single quiz by ID with questions"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Get quiz with creator info
        cursor.execute("""
            SELECT q.Quiz_ID, q.Creator_ID, q.Title, q.Description, 
                   q.Time_Limit_Minutes, q.Passing_Score, q.Difficulty_Level, 
                   q.Course_ID, q.Created_At, q.Enrollments, q.Average_Score,
                   up.Full_Name as Creator_Name, up.Profile_Pic as Creator_Profile_Pic
            FROM Quizzes q
            LEFT JOIN User_Profile up ON q.Creator_ID = up.User_ID
            WHERE q.Quiz_ID = %s
        """, (quiz_id,))
        
        quiz = cursor.fetchone()
        
        if not quiz:
            return {"error": "Quiz not found"}, 404
        
        # Get questions
        cursor.execute("""
            SELECT Question_ID, Question_Text, Question_Type, Options, Correct_Option, 
                   Explanation, Created_At
            FROM Quiz_Questions
            WHERE Quiz_ID = %s
            ORDER BY Question_ID
        """, (quiz_id,))
        
        questions = cursor.fetchall()
        
        # Check if user is enrolled
        is_enrolled = False
        if user_id:
            cursor.execute("""
                SELECT Enrollment_ID FROM Quiz_Enrollments
                WHERE Quiz_ID = %s AND User_ID = %s
            """, (quiz_id, user_id))
            
            is_enrolled = cursor.fetchone() is not None
        
        # Process datetime objects and JSON
        quiz['Created_At'] = quiz['Created_At'].isoformat() if quiz['Created_At'] else None
        for question in questions:
            question['Options'] = json.loads(question['Options']) if question['Options'] else []
        
        # Add questions to quiz
        quiz['Questions'] = questions if is_enrolled or quiz['Creator_ID'] == user_id else []
        quiz['Is_Enrolled'] = is_enrolled
        
        return {"quiz": quiz}, 200
    except Exception as e:
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

def enroll_in_quiz(quiz_id, user_id):
    """Enroll a user in a quiz"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if quiz exists
        cursor.execute("SELECT Quiz_ID FROM Quizzes WHERE Quiz_ID = %s", (quiz_id,))
        quiz = cursor.fetchone()
        
        if not quiz:
            return {"error": "Quiz not found"}, 404
        
        # Check if already enrolled
        cursor.execute("""
            SELECT Enrollment_ID FROM Quiz_Enrollments
            WHERE Quiz_ID = %s AND User_ID = %s
        """, (quiz_id, user_id))
        
        if cursor.fetchone():
            return {"error": "Already enrolled in this quiz"}, 400
        
        # Insert enrollment
        cursor.execute("""
            INSERT INTO Quiz_Enrollments (
                Quiz_ID, User_ID, Enrolled_At, Score, Last_Activity
            )
            VALUES (%s, %s, %s, %s, %s)
        """, (
            quiz_id, user_id, datetime.now(), None, datetime.now()
        ))
        
        # Update quiz enrollment count
        cursor.execute("""
            UPDATE Quizzes SET Enrollments = Enrollments + 1
            WHERE Quiz_ID = %s
        """, (quiz_id,))
        
        conn.commit()
        return {"message": "Successfully enrolled in quiz"}, 201
    except Exception as e:
        conn.rollback()
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

def submit_quiz(quiz_id, user_id, answers):
    """Submit answers for a quiz"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if enrolled
        cursor.execute("""
            SELECT Enrollment_ID FROM Quiz_Enrollments
            WHERE Quiz_ID = %s AND User_ID = %s
        """, (quiz_id, user_id))
        
        enrollment = cursor.fetchone()
        if not enrollment:
            return {"error": "Not enrolled in this quiz"}, 404
        
        # Check if already submitted
        cursor.execute("""
            SELECT * FROM Quiz_Submissions
            WHERE Quiz_ID = %s AND User_ID = %s
        """, (quiz_id, user_id))
        
        if cursor.fetchone():
            return {"error": "Quiz already submitted"}, 400
        
        # Insert submission
        cursor.execute("""
            INSERT INTO Quiz_Submissions (
                Quiz_ID, User_ID, Answers, Submitted_At
            )
            VALUES (%s, %s, %s, %s)
        """, (
            quiz_id, user_id, json.dumps(answers), datetime.now()
        ))
        
        # Calculate score
        cursor.execute("""
            SELECT Passing_Score, Question_Type, Correct_Option
            FROM Quiz_Questions
            WHERE Quiz_ID = %s
        """, (quiz_id,))
        
        questions = cursor.fetchall()
        score = 0
        total_questions = len(questions)
        
        for question in questions:
            if question['Question_Type'] == 'multiple_choice':
                if answers.get(str(question['Question_ID'])) == question['Correct_Option']:
                    score += 1
            elif question['Question_Type'] == 'true_false':
                if str(answers.get(str(question['Question_ID']))) == question['Correct_Option']:
                    score += 1
        
        # Update enrollment with score
        cursor.execute("""
            UPDATE Quiz_Enrollments
            SET Score = %s, Last_Activity = %s
            WHERE Quiz_ID = %s AND User_ID = %s
        """, (score, datetime.now(), quiz_id, user_id))
        
        # Update quiz average score
        cursor.execute("""
            UPDATE Quizzes q
            SET Average_Score = (
                SELECT AVG(Score) FROM Quiz_Enrollments
                WHERE Quiz_ID = %s
            )
            WHERE Quiz_ID = %s
        """, (quiz_id, quiz_id))
        
        conn.commit()
        return {"message": "Quiz submitted successfully", "score": score, "total_questions": total_questions}, 200
    except Exception as e:
        conn.rollback()
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

def get_quiz_results(user_id, quiz_id=None, page=1, per_page=20):
    """Get quiz results for a user with optional filtering"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    offset = (page - 1) * per_page
    
    try:
        # Base query
        query = """
            SELECT qe.Quiz_ID, qe.User_ID, qe.Score, qe.Last_Activity, 
                   q.Title, q.Difficulty_Level, q.Course_ID, q.Average_Score,
                   up.Full_Name as User_Name, up.Profile_Pic as User_Profile_Pic
            FROM Quiz_Enrollments qe
            JOIN Quizzes q ON qe.Quiz_ID = q.Quiz_ID
            JOIN User_Profile up ON qe.User_ID = up.User_ID
            WHERE qe.User_ID = %s
        """
        
        # Add filters
        params = [user_id]
        
        if quiz_id:
            query += " AND qe.Quiz_ID = %s"
            params.append(quiz_id)
        
        # Add order by and limit
        query += """
            ORDER BY qe.Last_Activity DESC
            LIMIT %s OFFSET %s
        """
        
        params.extend([per_page, offset])
        
        cursor.execute(query, params)
        results = cursor.fetchall()
        
        # Get total count for pagination
        count_query = "SELECT COUNT(*) as total FROM Quiz_Enrollments qe WHERE qe.User_ID = %s"
        count_params = [user_id]
        
        if quiz_id:
            count_query += " AND qe.Quiz_ID = %s"
            count_params.append(quiz_id)
        
        cursor.execute(count_query, count_params)
        total = cursor.fetchone()['total']
        
        # Process results
        for result in results:
            result['Last_Activity'] = result['Last_Activity'].isoformat() if result['Last_Activity'] else None
        
        return {
            "results": results,
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": (total + per_page - 1) // per_page
        }, 200
    except Exception as e:
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()
