import mysql.connector
from mysql.connector import pooling
import os
from datetime import datetime
import uuid
from flask import Blueprint, jsonify, request
import json
import math
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
                    INSERT INTO Blog_Tags (Post_ID, Tag_Name)
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

# ==================== INTERNSHIP FUNCTIONS ====================

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
        # Get internship with author info
        cursor.execute("""
            SELECT i.Internship_ID, i.User_ID, i.Title, i.Description, i.Application_URL, 
                   i.Created_At, up.Full_Name as Author_Name, up.Profile_Pic as Author_Profile_Pic
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
        
        # Get application count
        cursor.execute("""
            SELECT COUNT(*) as Application_Count 
            FROM Internship_Applications 
            WHERE Internship_ID = %s
        """, (internship_id,))
        
        application_count = cursor.fetchone()['Application_Count']
        
        # Process datetime objects
        internship['Created_At'] = internship['Created_At'].isoformat() if internship['Created_At'] else None
        internship['Tags'] = tags
        internship['Application_Count'] = application_count
        
        return {"internship": internship}, 200
    except Exception as e:
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

def update_internship(internship_id, user_id, title=None, description=None, tags=None, application_url=None):
    """Update an existing internship"""
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
    """Delete an internship"""
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
        
        # Check if already applied
        cursor.execute("""
            SELECT Application_ID FROM Internship_Applications 
            WHERE Internship_ID = %s AND User_ID = %s
        """, (internship_id, user_id))
        
        if cursor.fetchone():
            return {"error": "Already applied for this internship"}, 400
        
        # Add application
        cursor.execute("""
            INSERT INTO Internship_Applications (Internship_ID, User_ID, Status, Applied_At)
            VALUES (%s, %s, %s, %s)
        """, (internship_id, user_id, "Pending", datetime.now()))
        
        application_id = cursor.lastrowid
        
        conn.commit()
        return {"message": "Application submitted successfully", "application_id": application_id}, 201
    except Exception as e:
        conn.rollback()
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

# ==================== RESEARCH PAPER FUNCTIONS ====================

def upload_research_paper(user_id, title, abstract, authors, file_url, publication_date=None, 
                         journal=None, doi=None, keywords=None):
    """Upload a new research paper"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Insert research paper
        cursor.execute("""
            INSERT INTO Research_Papers (
                User_ID, Title, Abstract, Authors, File_URL, 
                Publication_Date, Journal, DOI, Created_At
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
                   rp.File_URL, rp.Publication_Date, rp.Journal, rp.DOI, rp.Created_At,
                   up.Full_Name as Uploader_Name,
                   GROUP_CONCAT(DISTINCT pk.Keyword) as Keywords
            FROM Research_Papers rp
            LEFT JOIN User_Profile up ON rp.User_ID = up.User_ID
            LEFT JOIN Paper_Keywords pk ON rp.Paper_ID = pk.Paper_ID
        """
        
        # Add filters
        where_clauses = []
        params = []
        
        if keyword:
            where_clauses.append("rp.Paper_ID IN (SELECT Paper_ID FROM Paper_Keywords WHERE Keyword = %s)")
            params.append(keyword)
        
        if user_id:
            where_clauses.append("rp.User_ID = %s")
            params.append(user_id)
        
        if where_clauses:
            query += " WHERE " + " AND ".join(where_clauses)
        
        # Add group by, order by and limit
        query += """
            GROUP BY rp.Paper_ID
            ORDER BY rp.Created_At DESC
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
        
        # Process papers to convert datetime objects to strings and parse JSON
        for paper in papers:
            paper['Created_At'] = paper['Created_At'].isoformat() if paper['Created_At'] else None
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
        # Get paper with uploader info
        cursor.execute("""
            SELECT rp.Paper_ID, rp.User_ID, rp.Title, rp.Abstract, rp.Authors, 
                   rp.File_URL, rp.Publication_Date, rp.Journal, rp.DOI, rp.Created_At,
                   up.Full_Name as Uploader_Name, up.Profile_Pic as Uploader_Profile_Pic
            FROM Research_Papers rp
            LEFT JOIN User_Profile up ON rp.User_ID = up.User_ID
            WHERE rp.Paper_ID = %s
        """, (paper_id,))
        
        paper = cursor.fetchone()
        
        if not paper:
            return {"error": "Research paper not found"}, 404
        
        # Get keywords
        cursor.execute("SELECT Keyword FROM Paper_Keywords WHERE Paper_ID = %s", (paper_id,))
        keywords = [row['Keyword'] for row in cursor.fetchall()]
        
        # Process datetime objects and JSON
        paper['Created_At'] = paper['Created_At'].isoformat() if paper['Created_At'] else None
        paper['Publication_Date'] = paper['Publication_Date'].isoformat() if paper['Publication_Date'] else None
        paper['Authors'] = json.loads(paper['Authors']) if paper['Authors'] else []
        paper['Keywords'] = keywords
        
        return {"paper": paper}, 200
    except Exception as e:
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

def update_research_paper(paper_id, user_id, title=None, abstract=None, authors=None,
                         file_url=None, publication_date=None, journal=None, doi=None, keywords=None):
    """Update an existing research paper"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if paper exists and belongs to user
        cursor.execute("SELECT User_ID FROM Research_Papers WHERE Paper_ID = %s", (paper_id,))
        paper = cursor.fetchone()
        
        if not paper:
            return {"error": "Research paper not found"}, 404
        
        if paper[0] != user_id:
            return {"error": "Unauthorized to edit this research paper"}, 403
        
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
            return {"error": "Research paper not found"}, 404
        
        if paper[0] != user_id:
            return {"error": "Unauthorized to delete this research paper"}, 403
        
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

# ==================== NOTE FUNCTIONS ====================

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
        
        # Process notes to convert datetime objects to strings
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
            SELECT Note_ID, User_ID, Title, Content, Category, Created_At, Updated_At
            FROM Notes
            WHERE Note_ID = %s
        """, (note_id,))
        
        note = cursor.fetchone()
        
        if not note:
            return {"error": "Note not found"}, 404
        
        # Check if note belongs to user
        if note['User_ID'] != user_id:
            return {"error": "Unauthorized to access this note"}, 403
        
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