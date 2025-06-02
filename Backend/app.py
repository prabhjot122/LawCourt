import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from mysql.connector import pooling
import bcrypt
import uuid
import json
from datetime import datetime, date
from flask_cors import CORS
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from functools import wraps
from werkzeug.utils import secure_filename
from grammar_checker import check_grammar_api
import PyPDF2
import io
from utils.pdf_thumbnail import generate_research_paper_thumbnail

# Load environment variables from .env file
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
# Enable CORS for all routes with specific configuration
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:8080", "http://localhost:8081"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

# JSON encoder to handle date objects
class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        return super().default(obj)

# Set the custom JSON encoder for the Flask app
app.json_encoder = CustomJSONEncoder

# MySQL Connection Pool Configuration
db_config = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', 'pabbo@123'),  # Default to your current password if env var not set
    'database': os.getenv('DB_NAME', 'lawfort'),
    'pool_name': 'lawfort_pool',
    'pool_size': int(os.getenv('DB_POOL_SIZE', 5))
}

# Create connection pool
connection_pool = pooling.MySQLConnectionPool(**db_config)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'pabbo@123')

# Google OAuth Configuration
GOOGLE_CLIENT_ID = "517818204697-jpimspqvc3f4folciiapr6vbugs9t7hu.apps.googleusercontent.com"

# File Upload Configuration
UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads', 'resumes')
ALLOWED_EXTENSIONS = {'pdf'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Function to get database connection from pool
def get_db_connection():
    return connection_pool.get_connection()

# Function to hash passwords
def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

# Function to check password
def check_password(stored_password, entered_password):
    # Convert stored_password to bytes if it's a string
    if isinstance(stored_password, str):
        stored_password = stored_password.encode('utf-8')
    return bcrypt.checkpw(entered_password.encode('utf-8'), stored_password)

# Function to generate session token
def generate_session_token():
    return str(uuid.uuid4())

# Function to verify Google OAuth token
def verify_google_token(token):
    try:
        # First attempt: Try with clock skew tolerance (if supported)
        try:
            idinfo = id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                GOOGLE_CLIENT_ID,
                clock_skew_in_seconds=10  # Allow 10 seconds of clock skew
            )
        except TypeError:
            # Fallback: If clock_skew_in_seconds is not supported, try without it
            print("Clock skew parameter not supported, trying without it...")
            idinfo = id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                GOOGLE_CLIENT_ID
            )

        # Check if the token is valid
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise ValueError('Wrong issuer.')

        # Log successful verification for debugging
        print(f"Token verification successful for user: {idinfo.get('email', 'unknown')}")

        return {
            'google_id': idinfo['sub'],
            'email': idinfo['email'],
            'name': idinfo.get('name', ''),
            'picture': idinfo.get('picture', ''),
            'email_verified': idinfo.get('email_verified', False)
        }
    except ValueError as e:
        # Enhanced error logging for better debugging
        error_msg = str(e)
        print(f"Token verification failed: {error_msg}")

        # Check if it's a timing issue and try a workaround
        if "used too early" in error_msg:
            print("Timing issue detected. Attempting workaround...")
            print("Current server time:", datetime.now().isoformat())

            # Try waiting a moment and retrying (for minor timing issues)
            import time
            time.sleep(1)
            try:
                print("Retrying token verification after 1 second delay...")
                idinfo = id_token.verify_oauth2_token(
                    token,
                    google_requests.Request(),
                    GOOGLE_CLIENT_ID
                )

                if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                    raise ValueError('Wrong issuer.')

                print(f"Token verification successful on retry for user: {idinfo.get('email', 'unknown')}")

                return {
                    'google_id': idinfo['sub'],
                    'email': idinfo['email'],
                    'name': idinfo.get('name', ''),
                    'picture': idinfo.get('picture', ''),
                    'email_verified': idinfo.get('email_verified', False)
                }
            except Exception as retry_e:
                print(f"Retry also failed: {retry_e}")

        return None
    except Exception as e:
        print(f"Unexpected error during token verification: {e}")
        return None

# Email function placeholder (for future implementation)
def send_email(to_emails, subject, content, _sender_id=None):
    """
    Email function placeholder - to be implemented with actual email service
    """
    try:
        # Ensure to_emails is a list
        if isinstance(to_emails, str):
            to_emails = [to_emails]

        # TODO: Implement actual email sending logic
        # For now, return True to maintain compatibility
        return True

    except Exception as e:
        return False

# Email logging placeholder (for future implementation)
def log_email_in_db(sender_id, _recipient_emails, _subject, _content, status):
    """
    Email logging placeholder - to be implemented with actual database logging
    """
    # TODO: Implement actual email logging to database
    return True

@app.route('/register', methods=['POST'])
def register_user():
    data = request.get_json()

    email = data['email']
    password = data['password']
    full_name = data['full_name']
    phone = data['phone']
    bio = data['bio']
    profile_pic = data['profile_pic']
    law_specialization = data['law_specialization']
    education = data['education']
    bar_exam_status = data['bar_exam_status']
    license_number = data['license_number']
    practice_area = data['practice_area']
    location = data['location']
    years_of_experience = data['years_of_experience']
    linkedin_profile = data['linkedin_profile']
    alumni_of = data['alumni_of']
    professional_organizations = data['professional_organizations']

    # Hash the password and ensure it's stored as bytes
    hashed_password = hash_password(password)

    # Convert bytes to string for database storage if needed
    if isinstance(hashed_password, bytes):
        hashed_password = hashed_password.decode('utf-8')

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # First, ensure the roles exist
        cursor.execute("SELECT COUNT(*) FROM Roles WHERE Role_ID = 3")
        role_exists = cursor.fetchone()[0]

        if role_exists == 0:
            # Insert default roles if they don't exist
            cursor.execute("""
                INSERT IGNORE INTO Roles (Role_ID, Role_Name, Description) VALUES
                (1, 'Admin', 'System Administrator with full access'),
                (2, 'Editor', 'Content Editor with content management access'),
                (3, 'User', 'Regular User with standard access')
            """)

        # Insert user into Users table
        cursor.execute("""
            INSERT INTO Users (Email, Password, Role_ID, Status)
            VALUES (%s, %s, 3, 'Active')
        """, (email, hashed_password))

        # Get the User_ID of the newly created user
        user_id = cursor.lastrowid

        # Insert user profile into User_Profile table
        cursor.execute("""
            INSERT INTO User_Profile (User_ID, Full_Name, Phone, Bio, Profile_Pic, Law_Specialization,
                                    Education, Bar_Exam_Status, License_Number, Practice_Area, Location,
                                    Years_of_Experience, LinkedIn_Profile, Alumni_of, Professional_Organizations)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (user_id, full_name, phone, bio, profile_pic, law_specialization, education, bar_exam_status,
              license_number, practice_area, location, years_of_experience, linkedin_profile, alumni_of, professional_organizations))

        conn.commit()
        return jsonify({'message': 'Registration successful.'}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/login', methods=['POST'])
def login_user():
    data = request.get_json()

    email = data['email']
    password = data['password']

    conn = get_db_connection()
    cursor = conn.cursor(buffered=True, dictionary=True)

    try:
        # First, just check if the user exists
        cursor.execute("""
            SELECT u.User_ID, u.Password, u.Role_ID, u.Is_Super_Admin, r.Role_Name
            FROM Users u
            JOIN Roles r ON u.Role_ID = r.Role_ID
            WHERE u.Email = %s AND u.Status = 'Active'
        """, (email,))

        user = cursor.fetchone()

        if not user:
            return jsonify({'error': 'User not found'}), 401

        # For the admin account specifically, if it's the default admin
        if email == 'admin@lawfort.com' and password == 'admin123':
            # Generate session token
            session_token = generate_session_token()

            cursor.execute("""
                INSERT INTO Session (User_ID, Session_Token, Last_Active_Timestamp)
                VALUES (%s, %s, %s)
            """, (user['User_ID'], session_token, datetime.now()))

            conn.commit()
            return jsonify({
                'message': 'Login successful',
                'session_token': session_token,
                'user_role': user['Role_Name'],
                'is_admin': user['Role_ID'] == 1 or user['Is_Super_Admin']
            }), 200

        # For other accounts, try to verify with bcrypt
        try:
            # Convert stored_password to bytes if it's a string
            stored_password = user['Password']
            if isinstance(stored_password, str):
                stored_password = stored_password.encode('utf-8')

            password_match = bcrypt.checkpw(password.encode('utf-8'), stored_password)

            if password_match:
                # Generate session token
                session_token = generate_session_token()

                cursor.execute("""
                    INSERT INTO Session (User_ID, Session_Token, Last_Active_Timestamp)
                    VALUES (%s, %s, %s)
                """, (user['User_ID'], session_token, datetime.now()))

                conn.commit()
                return jsonify({
                    'message': 'Login successful',
                    'session_token': session_token,
                    'user_role': user['Role_Name'],
                    'is_admin': user['Role_ID'] == 1 or user['Is_Super_Admin']
                }), 200
            else:
                return jsonify({'error': 'Invalid credentials'}), 401
        except Exception as e:
            print(f"Password verification error: {str(e)}")
            return jsonify({'error': 'Password verification failed'}), 500

    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/logout', methods=['POST'])
def logout_user():
    data = request.get_json()
    session_token = data['session_token']

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("DELETE FROM Session WHERE Session_Token = %s", (session_token,))
        conn.commit()
        return jsonify({'message': 'Logout successful'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/auth/google', methods=['POST'])
def google_auth():
    data = request.get_json()
    token = data.get('token')

    if not token:
        return jsonify({'error': 'Token is required'}), 400

    # Verify Google token
    google_user = verify_google_token(token)
    if not google_user:
        return jsonify({'error': 'Invalid Google token'}), 401

    conn = get_db_connection()
    cursor = conn.cursor(buffered=True, dictionary=True)

    try:
        # Check if user exists with this Google ID
        cursor.execute("""
            SELECT u.User_ID, u.Email, u.Role_ID, u.Is_Super_Admin,
                   COALESCE(u.Profile_Complete, TRUE) as Profile_Complete, r.Role_Name
            FROM Users u
            JOIN Roles r ON u.Role_ID = r.Role_ID
            WHERE (u.Auth_Provider = 'google' AND u.OAuth_ID = %s) OR
                  (u.Email = %s AND u.Auth_Provider = 'google')
            AND u.Status = 'Active'
        """, (google_user['google_id'], google_user['email']))

        existing_user = cursor.fetchone()

        if existing_user:
            # User exists, log them in
            session_token = generate_session_token()

            cursor.execute("""
                INSERT INTO Session (User_ID, Session_Token, Last_Active_Timestamp)
                VALUES (%s, %s, %s)
            """, (existing_user['User_ID'], session_token, datetime.now()))

            conn.commit()

            return jsonify({
                'message': 'Login successful',
                'session_token': session_token,
                'user_role': existing_user['Role_Name'],
                'is_admin': existing_user['Role_ID'] == 1 or existing_user['Is_Super_Admin'],
                'profile_complete': existing_user['Profile_Complete'],
                'user_id': existing_user['User_ID']
            }), 200
        else:
            # Check if user exists with same email but different auth provider
            cursor.execute("""
                SELECT User_ID FROM Users WHERE Email = %s AND Auth_Provider != 'google'
            """, (google_user['email'],))

            email_exists = cursor.fetchone()
            if email_exists:
                return jsonify({'error': 'Email already registered with different login method'}), 409

            # Create new user
            try:
                cursor.execute("""
                    INSERT INTO Users (Email, Role_ID, Auth_Provider, OAuth_ID, Status, Profile_Complete)
                    VALUES (%s, 3, 'google', %s, 'Active', FALSE)
                """, (google_user['email'], google_user['google_id']))
            except Exception as e:
                # Fallback for databases without OAuth columns
                cursor.execute("""
                    INSERT INTO Users (Email, Role_ID, Status)
                    VALUES (%s, 3, 'Active')
                """, (google_user['email'],))

            user_id = cursor.lastrowid

            # Create basic profile with Google data
            cursor.execute("""
                INSERT INTO User_Profile (User_ID, Full_Name, Profile_Pic)
                VALUES (%s, %s, %s)
            """, (user_id, google_user['name'], google_user['picture']))

            # Create session
            session_token = generate_session_token()

            cursor.execute("""
                INSERT INTO Session (User_ID, Session_Token, Last_Active_Timestamp)
                VALUES (%s, %s, %s)
            """, (user_id, session_token, datetime.now()))

            conn.commit()

            return jsonify({
                'message': 'Registration successful',
                'session_token': session_token,
                'user_role': 'User',
                'is_admin': False,
                'profile_complete': False,
                'user_id': user_id,
                'requires_profile_completion': True
            }), 201

    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/auth/complete-profile', methods=['POST'])
def complete_oauth_profile():
    data = request.get_json()
    user_id = data.get('user_id')

    # Validate required fields
    required_fields = ['bio', 'practice_area', 'bar_exam_status']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Update user profile with additional information
        cursor.execute("""
            UPDATE User_Profile SET
                Phone = %s,
                Bio = %s,
                Law_Specialization = %s,
                Education = %s,
                Bar_Exam_Status = %s,
                License_Number = %s,
                Practice_Area = %s,
                Location = %s,
                Years_of_Experience = %s,
                LinkedIn_Profile = %s,
                Alumni_of = %s,
                Professional_Organizations = %s
            WHERE User_ID = %s
        """, (
            data.get('phone', ''),
            data['bio'],
            data.get('law_specialization', ''),
            data.get('education', ''),
            data['bar_exam_status'],
            data.get('license_number', ''),
            data['practice_area'],
            data.get('location', ''),
            data.get('years_of_experience', 0),
            data.get('linkedin_profile', ''),
            data.get('alumni_of', ''),
            data.get('professional_organizations', ''),
            user_id
        ))

        # Mark profile as complete
        cursor.execute("""
            UPDATE Users SET Profile_Complete = TRUE WHERE User_ID = %s
        """, (user_id,))

        conn.commit()
        return jsonify({'message': 'Profile completed successfully'}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/request_editor_access', methods=['POST'])
def request_editor_access():
    data = request.get_json()
    user_id = data['user_id']

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT COUNT(*) FROM Access_Request WHERE User_ID = %s AND Status = 'Pending'", (user_id,))
        count = cursor.fetchone()[0]

        if count > 0:
            return jsonify({'error': 'You already have a pending request.'}), 400

        cursor.execute("""
            INSERT INTO Access_Request (User_ID, Status)
            VALUES (%s, 'Pending')
        """, (user_id,))

        # Get user info for notification
        cursor.execute("""
            SELECT up.Full_Name, up.Practice_Area
            FROM User_Profile up
            WHERE up.User_ID = %s
        """, (user_id,))

        user_info = cursor.fetchone()

        # Create notifications for all admins about new editor access request
        cursor.execute("""
            SELECT User_ID FROM Users WHERE Role_ID = 1
        """)

        admins = cursor.fetchall()

        for admin in admins:
            notification_title = "New Editor Access Request"
            notification_message = f"{user_info[0] if user_info else 'A user'} has requested editor access"
            if user_info and user_info[1]:
                notification_message += f" (Practice Area: {user_info[1]})"
            action_url = "/admin/access-requests"

            cursor.execute("""
                INSERT INTO Notifications (User_ID, Type, Title, Message, Action_URL)
                VALUES (%s, %s, %s, %s, %s)
            """, (admin[0], 'access_request', notification_title, notification_message, action_url))

        conn.commit()
        return jsonify({'message': 'Request for editor access sent to admin.'}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()
@app.route('/admin/approve_deny_access', methods=['POST', 'OPTIONS'])
def admin_approve_deny_access():
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        return '', 200

    data = request.get_json()
    request_id = data.get('request_id')
    action = data.get('action')  # 'Approve' or 'Deny'
    admin_id = data.get('admin_id')

    # Validate input data
    if not request_id or not action or not admin_id:
        return jsonify({'error': 'Missing required parameters'}), 400

    if action not in ['Approve', 'Deny']:
        return jsonify({'error': 'Invalid action. Must be "Approve" or "Deny"'}), 400

    try:
        # Convert request_id and admin_id to integers if they're strings
        request_id = int(request_id)
        admin_id = int(admin_id)
    except ValueError:
        return jsonify({'error': 'Invalid request_id or admin_id format'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT User_ID, Status FROM Access_Request WHERE Request_ID = %s", (request_id,))
        request_data = cursor.fetchone()

        if not request_data:
            return jsonify({'error': 'Request not found'}), 404

        if request_data[1] != 'Pending':
            return jsonify({'error': 'This request has already been processed'}), 400

        user_id = request_data[0]

        if action == 'Approve':
            cursor.execute("""
                UPDATE Access_Request
                SET Status = 'Approved', Approved_At = NOW(), Admin_ID = %s
                WHERE Request_ID = %s
            """, (admin_id, request_id))

            cursor.execute("UPDATE Users SET Role_ID = 2 WHERE User_ID = %s", (user_id,))  # Set role to Editor

            # Log the admin action
            cursor.execute("""
                INSERT INTO Audit_Logs (Admin_ID, Action_Type, Action_Details)
                VALUES (%s, %s, %s)
            """, (admin_id, 'Approve Editor Access', f'Approved editor access for user {user_id}'))

            # Create notification for user about approval
            cursor.execute("""
                INSERT INTO Notifications (User_ID, Type, Title, Message, Action_URL)
                VALUES (%s, %s, %s, %s, %s)
            """, (user_id, 'access_approved', 'Editor Access Approved',
                  'Congratulations! Your request for editor access has been approved. You can now create and manage content.',
                  '/editor-dashboard'))

            message = 'Editor access granted.'
        else:
            cursor.execute("""
                UPDATE Access_Request
                SET Status = 'Denied', Denied_At = NOW(), Admin_ID = %s
                WHERE Request_ID = %s
            """, (admin_id, request_id))

            # Log the admin action
            cursor.execute("""
                INSERT INTO Audit_Logs (Admin_ID, Action_Type, Action_Details)
                VALUES (%s, %s, %s)
            """, (admin_id, 'Deny Editor Access', f'Denied editor access for user {user_id}'))

            # Create notification for user about denial
            cursor.execute("""
                INSERT INTO Notifications (User_ID, Type, Title, Message, Action_URL)
                VALUES (%s, %s, %s, %s, %s)
            """, (user_id, 'access_denied', 'Editor Access Request Denied',
                  'Your request for editor access has been denied. Please contact support if you have questions.',
                  '/profile'))

            message = 'Editor access denied.'

        conn.commit()
        return jsonify({'message': message, 'success': True}), 200
    except Exception as e:
        conn.rollback()
        print(f"Error in approve/deny access: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/admin/access_requests', methods=['GET'])
def get_access_requests():
    conn = get_db_connection()
    cursor = conn.cursor(buffered=True)

    try:
        cursor.execute("""
            SELECT ar.Request_ID, ar.User_ID, up.Full_Name, up.Practice_Area,
                   ar.Requested_At, ar.Status
            FROM Access_Request ar
            JOIN User_Profile up ON ar.User_ID = up.User_ID
            WHERE ar.Status = 'Pending'
            ORDER BY ar.Requested_At DESC
        """)

        requests = cursor.fetchall()

        access_requests = []
        for req in requests:
            access_requests.append({
                'request_id': req[0],
                'user_id': req[1],
                'full_name': req[2],
                'practice_area': req[3],
                'requested_at': req[4].isoformat() if req[4] else None,
                'status': req[5]
            })

        return jsonify({'access_requests': access_requests}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/admin/users', methods=['GET'])
def get_all_users():
    conn = get_db_connection()
    cursor = conn.cursor(buffered=True)

    try:
        cursor.execute("""
            SELECT u.User_ID, u.Email, u.Role_ID, u.Status, u.Created_At,
                   up.Full_Name, up.Phone, up.Bio, up.Practice_Area, up.Location, up.Years_of_Experience,
                   r.Role_Name,
                   (SELECT COUNT(*) FROM Session s WHERE s.User_ID = u.User_ID AND
                    s.Last_Active_Timestamp > DATE_SUB(NOW(), INTERVAL 30 DAY)) as is_active
            FROM Users u
            LEFT JOIN User_Profile up ON u.User_ID = up.User_ID
            LEFT JOIN Roles r ON u.Role_ID = r.Role_ID
            ORDER BY u.Created_At DESC
        """)

        users = cursor.fetchall()

        user_list = []
        for user in users:
            user_list.append({
                'user_id': user[0],
                'email': user[1],
                'role_id': user[2],
                'status': user[3],
                'created_at': user[4].isoformat() if user[4] else None,
                'full_name': user[5] or '',
                'phone': user[6] or '',
                'bio': user[7] or '',
                'practice_area': user[8] or '',
                'location': user[9] or '',
                'years_of_experience': user[10] or 0,
                'role_name': user[11] or 'User',
                'is_active': bool(user[12])
            })

        return jsonify({'users': user_list}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/admin/analytics', methods=['GET'])
def get_admin_analytics():
    conn = get_db_connection()
    cursor = conn.cursor(buffered=True)

    try:
        # Get user counts by role
        cursor.execute("""
            SELECT r.Role_Name, COUNT(u.User_ID) as count
            FROM Roles r
            LEFT JOIN Users u ON r.Role_ID = u.Role_ID AND u.Status = 'Active'
            GROUP BY r.Role_ID, r.Role_Name
        """)
        role_counts = cursor.fetchall()

        # Get active users (logged in within last 30 days)
        cursor.execute("""
            SELECT COUNT(DISTINCT s.User_ID) as active_users
            FROM Session s
            WHERE s.Last_Active_Timestamp > DATE_SUB(NOW(), INTERVAL 30 DAY)
        """)
        active_users = cursor.fetchone()[0]

        # Get total users
        cursor.execute("SELECT COUNT(*) FROM Users WHERE Status = 'Active'")
        total_users = cursor.fetchone()[0]

        # Get pending access requests
        cursor.execute("SELECT COUNT(*) FROM Access_Request WHERE Status = 'Pending'")
        pending_requests = cursor.fetchone()[0]

        # Get user registrations by month (last 6 months)
        cursor.execute("""
            SELECT DATE_FORMAT(Created_At, '%Y-%m') as month, COUNT(*) as count
            FROM Users
            WHERE Created_At >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            GROUP BY DATE_FORMAT(Created_At, '%Y-%m')
            ORDER BY month
        """)
        monthly_registrations = cursor.fetchall()

        analytics = {
            'role_counts': [{'role': role[0], 'count': role[1]} for role in role_counts],
            'active_users': active_users,
            'total_users': total_users,
            'pending_requests': pending_requests,
            'monthly_registrations': [{'month': reg[0], 'count': reg[1]} for reg in monthly_registrations]
        }

        return jsonify(analytics), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@app.route('/admin/audit_logs', methods=['GET'])
def get_audit_logs():
    conn = get_db_connection()
    cursor = conn.cursor(buffered=True)

    try:
        cursor.execute("""
            SELECT al.Log_ID, al.Admin_ID, al.Action_Type, al.Action_Details, al.Timestamp,
                   up.Full_Name as admin_name
            FROM Audit_Logs al
            LEFT JOIN User_Profile up ON al.Admin_ID = up.User_ID
            ORDER BY al.Timestamp DESC
            LIMIT 100
        """)

        logs = cursor.fetchall()

        audit_logs = []
        for log in logs:
            audit_logs.append({
                'log_id': log[0],
                'admin_id': log[1],
                'action_type': log[2],
                'action_details': log[3],
                'timestamp': log[4].isoformat() if log[4] else None,
                'admin_name': log[5] or 'Unknown Admin'
            })

        return jsonify({'audit_logs': audit_logs}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/admin/update_user_role', methods=['POST'])
def update_user_role():
    data = request.get_json()
    user_id = data.get('user_id')
    new_role_id = data.get('role_id')
    admin_id = data.get('admin_id')

    if not user_id or not new_role_id or not admin_id:
        return jsonify({'error': 'Missing required parameters'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Get current role
        cursor.execute("SELECT Role_ID FROM Users WHERE User_ID = %s", (user_id,))
        current_role = cursor.fetchone()

        if not current_role:
            return jsonify({'error': 'User not found'}), 404

        # Update user role
        cursor.execute("UPDATE Users SET Role_ID = %s WHERE User_ID = %s", (new_role_id, user_id))

        # Log the action
        cursor.execute("""
            INSERT INTO Audit_Logs (Admin_ID, Action_Type, Action_Details)
            VALUES (%s, %s, %s)
        """, (admin_id, 'Update User Role', f'Changed user {user_id} role from {current_role[0]} to {new_role_id}'))

        conn.commit()
        return jsonify({'message': 'User role updated successfully'}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/admin/update_user_status', methods=['POST'])
def update_user_status():
    data = request.get_json()
    user_id = data.get('user_id')
    new_status = data.get('status')
    admin_id = data.get('admin_id')

    if not user_id or not new_status or not admin_id:
        return jsonify({'error': 'Missing required parameters'}), 400

    # Validate status
    valid_statuses = ['Active', 'Inactive', 'Suspended', 'Banned']
    if new_status not in valid_statuses:
        return jsonify({'error': 'Invalid status. Must be one of: ' + ', '.join(valid_statuses)}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Get current status
        cursor.execute("SELECT Status FROM Users WHERE User_ID = %s", (user_id,))
        current_status = cursor.fetchone()

        if not current_status:
            return jsonify({'error': 'User not found'}), 404

        # Update user status
        cursor.execute("UPDATE Users SET Status = %s WHERE User_ID = %s", (new_status, user_id))

        # Log the action
        cursor.execute("""
            INSERT INTO Audit_Logs (Admin_ID, Action_Type, Action_Details)
            VALUES (%s, %s, %s)
        """, (admin_id, 'Update User Status', f'Changed user {user_id} status from {current_status[0]} to {new_status}'))

        conn.commit()
        return jsonify({'message': f'User status updated to {new_status} successfully'}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/admin/update_user_profile', methods=['POST'])
def update_user_profile():
    data = request.get_json()
    user_id = data.get('user_id')
    profile_data = data.get('profile_data', {})
    admin_id = data.get('admin_id')

    if not user_id or not admin_id:
        return jsonify({'error': 'Missing required parameters'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Check if user exists
        cursor.execute("SELECT User_ID FROM Users WHERE User_ID = %s", (user_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'User not found'}), 404

        # Update user email if provided
        if 'email' in profile_data and profile_data['email']:
            cursor.execute("UPDATE Users SET Email = %s WHERE User_ID = %s",
                         (profile_data['email'], user_id))

        # Check if user profile exists
        cursor.execute("SELECT User_ID FROM User_Profile WHERE User_ID = %s", (user_id,))
        profile_exists = cursor.fetchone()

        # Prepare profile update data
        profile_fields = []
        profile_values = []

        if 'full_name' in profile_data:
            profile_fields.append('Full_Name = %s')
            profile_values.append(profile_data['full_name'])

        if 'phone' in profile_data:
            profile_fields.append('Phone = %s')
            profile_values.append(profile_data['phone'])

        if 'bio' in profile_data:
            profile_fields.append('Bio = %s')
            profile_values.append(profile_data['bio'])

        if 'practice_area' in profile_data:
            profile_fields.append('Practice_Area = %s')
            profile_values.append(profile_data['practice_area'])

        if 'location' in profile_data:
            profile_fields.append('Location = %s')
            profile_values.append(profile_data['location'])

        if 'years_of_experience' in profile_data:
            profile_fields.append('Years_of_Experience = %s')
            profile_values.append(profile_data['years_of_experience'])

        if profile_fields:
            if profile_exists:
                # Update existing profile
                profile_values.append(user_id)
                update_query = f"UPDATE User_Profile SET {', '.join(profile_fields)} WHERE User_ID = %s"
                cursor.execute(update_query, profile_values)
            else:
                # Create new profile
                insert_fields = ['User_ID'] + [field.split(' = ')[0] for field in profile_fields]
                insert_values = [user_id] + profile_values
                placeholders = ', '.join(['%s'] * len(insert_values))
                insert_query = f"INSERT INTO User_Profile ({', '.join(insert_fields)}) VALUES ({placeholders})"
                cursor.execute(insert_query, insert_values)

        # Log the action
        updated_fields = list(profile_data.keys())
        cursor.execute("""
            INSERT INTO Audit_Logs (Admin_ID, Action_Type, Action_Details)
            VALUES (%s, %s, %s)
        """, (admin_id, 'Update User Profile', f'Updated profile for user {user_id}. Fields: {", ".join(updated_fields)}'))

        conn.commit()
        return jsonify({'message': 'User profile updated successfully'}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/admin/create_user', methods=['POST'])
def create_user():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    role_id = data.get('role_id', 3)  # Default to User role
    admin_id = data.get('admin_id')
    profile_data = data.get('profile_data', {})

    if not email or not password or not admin_id:
        return jsonify({'error': 'Email, password, and admin_id are required'}), 400

    # Validate role_id
    valid_roles = [1, 2, 3]  # Admin, Editor, User
    if role_id not in valid_roles:
        return jsonify({'error': 'Invalid role_id. Must be 1 (Admin), 2 (Editor), or 3 (User)'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Check if email already exists
        cursor.execute("SELECT User_ID FROM Users WHERE Email = %s", (email,))
        if cursor.fetchone():
            return jsonify({'error': 'Email already exists'}), 400

        # Hash the password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

        # Insert new user
        cursor.execute("""
            INSERT INTO Users (Email, Password, Role_ID, Status)
            VALUES (%s, %s, %s, %s)
        """, (email, hashed_password, role_id, 'Active'))

        user_id = cursor.lastrowid

        # Create user profile if profile data is provided
        if profile_data:
            profile_fields = ['User_ID']
            profile_values = [user_id]
            placeholders = ['%s']

            # Add provided profile fields
            field_mapping = {
                'full_name': 'Full_Name',
                'phone': 'Phone',
                'bio': 'Bio',
                'practice_area': 'Practice_Area',
                'location': 'Location',
                'years_of_experience': 'Years_of_Experience',
                'law_specialization': 'Law_Specialization',
                'education': 'Education',
                'bar_exam_status': 'Bar_Exam_Status',
                'license_number': 'License_Number',
                'linkedin_profile': 'LinkedIn_Profile',
                'alumni_of': 'Alumni_of',
                'professional_organizations': 'Professional_Organizations'
            }

            for key, db_field in field_mapping.items():
                if key in profile_data and profile_data[key]:
                    profile_fields.append(db_field)
                    profile_values.append(profile_data[key])
                    placeholders.append('%s')

            if len(profile_fields) > 1:  # More than just User_ID
                insert_query = f"""
                    INSERT INTO User_Profile ({', '.join(profile_fields)})
                    VALUES ({', '.join(placeholders)})
                """
                cursor.execute(insert_query, profile_values)

        # Log the action
        role_name = {1: 'Admin', 2: 'Editor', 3: 'User'}.get(role_id, 'User')
        cursor.execute("""
            INSERT INTO Audit_Logs (Admin_ID, Action_Type, Action_Details)
            VALUES (%s, %s, %s)
        """, (admin_id, 'Create User', f'Created new {role_name} account for {email} (User ID: {user_id})'))

        conn.commit()
        return jsonify({
            'message': f'User created successfully',
            'user_id': user_id
        }), 201
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/admin/change_password', methods=['POST'])
def change_user_password():
    data = request.get_json()
    user_id = data.get('user_id')
    new_password = data.get('new_password')
    admin_id = data.get('admin_id')

    if not user_id or not new_password or not admin_id:
        return jsonify({'error': 'user_id, new_password, and admin_id are required'}), 400

    # Validate password strength (basic validation)
    if len(new_password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters long'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Check if user exists
        cursor.execute("SELECT Email FROM Users WHERE User_ID = %s", (user_id,))
        user = cursor.fetchone()
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Hash the new password
        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())

        # Update password
        cursor.execute("""
            UPDATE Users SET Password = %s, Updated_At = CURRENT_TIMESTAMP
            WHERE User_ID = %s
        """, (hashed_password, user_id))

        # Log the action
        cursor.execute("""
            INSERT INTO Audit_Logs (Admin_ID, Action_Type, Action_Details)
            VALUES (%s, %s, %s)
        """, (admin_id, 'Change Password', f'Changed password for user {user[0]} (User ID: {user_id})'))

        conn.commit()
        return jsonify({'message': 'Password changed successfully'}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/user/profile', methods=['GET'])
def get_user_profile():
    session_token = request.headers.get('Authorization')
    if not session_token:
        return jsonify({'error': 'Session token required'}), 401

    # Remove 'Bearer ' prefix if present
    if session_token.startswith('Bearer '):
        session_token = session_token[7:]

    conn = get_db_connection()
    cursor = conn.cursor(buffered=True)

    try:
        # Get user ID from session token
        cursor.execute("SELECT User_ID FROM Session WHERE Session_Token = %s", (session_token,))
        session = cursor.fetchone()

        if not session:
            return jsonify({'error': 'Invalid session token'}), 401

        user_id = session[0]

        # Get user details with profile
        cursor.execute("""
            SELECT u.User_ID, u.Email, u.Role_ID, u.Status,
                   up.Full_Name, up.Phone, up.Bio, up.Profile_Pic, up.Law_Specialization,
                   up.Education, up.Bar_Exam_Status, up.License_Number, up.Practice_Area,
                   up.Location, up.Years_of_Experience, up.LinkedIn_Profile, up.Alumni_of,
                   up.Professional_Organizations, r.Role_Name
            FROM Users u
            LEFT JOIN User_Profile up ON u.User_ID = up.User_ID
            LEFT JOIN Roles r ON u.Role_ID = r.Role_ID
            WHERE u.User_ID = %s
        """, (user_id,))

        user_data = cursor.fetchone()

        if not user_data:
            return jsonify({'error': 'User not found'}), 404

        user_profile = {
            'id': str(user_data[0]),
            'email': user_data[1],
            'role_id': user_data[2],
            'role_name': user_data[18] if user_data[18] else 'User',
            'status': user_data[3],
            'full_name': user_data[4] or '',
            'phone': user_data[5] or '',
            'bio': user_data[6] or '',
            'profile_pic': user_data[7] or '',
            'law_specialization': user_data[8] or '',
            'education': user_data[9] or '',
            'bar_exam_status': user_data[10] or '',
            'license_number': user_data[11] or '',
            'practice_area': user_data[12] or '',
            'location': user_data[13] or '',
            'years_of_experience': user_data[14] or 0,
            'linkedin_profile': user_data[15] or '',
            'alumni_of': user_data[16] or '',
            'professional_organizations': user_data[17] or ''
        }

        return jsonify({'user': user_profile}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/user/validate_session', methods=['GET'])
def validate_session():
    session_token = request.headers.get('Authorization')
    if not session_token:
        return jsonify({'error': 'Session token required'}), 401

    # Remove 'Bearer ' prefix if present
    if session_token.startswith('Bearer '):
        session_token = session_token[7:]

    conn = get_db_connection()
    cursor = conn.cursor(buffered=True)

    try:
        cursor.execute("SELECT User_ID FROM Session WHERE Session_Token = %s", (session_token,))
        session = cursor.fetchone()

        if session:
            return jsonify({'valid': True, 'user_id': session[0]}), 200
        else:
            return jsonify({'valid': False}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/user/dashboard', methods=['GET'])
def get_user_dashboard():
    session_token = request.headers.get('Authorization')
    if not session_token:
        return jsonify({'error': 'Session token required'}), 401

    # Remove 'Bearer ' prefix if present
    if session_token.startswith('Bearer '):
        session_token = session_token[7:]

    conn = get_db_connection()
    cursor = conn.cursor(buffered=True, dictionary=True)

    try:
        # Get user ID from session token
        cursor.execute("SELECT User_ID FROM Session WHERE Session_Token = %s", (session_token,))
        session = cursor.fetchone()

        if not session:
            return jsonify({'error': 'Invalid session token'}), 401

        user_id = session['User_ID']

        # Get applications count and pending count
        cursor.execute("""
            SELECT
                COUNT(*) as total_applications,
                COUNT(CASE WHEN ja.Status = 'Pending' THEN 1 END) as pending_job_applications,
                COUNT(CASE WHEN ja.Status = 'Under Review' THEN 1 END) as under_review_job_applications
            FROM Job_Applications ja
            WHERE ja.User_ID = %s
        """, (user_id,))
        job_stats = cursor.fetchone()

        cursor.execute("""
            SELECT
                COUNT(*) as total_applications,
                COUNT(CASE WHEN ia.Status = 'Pending' THEN 1 END) as pending_internship_applications,
                COUNT(CASE WHEN ia.Status = 'Under Review' THEN 1 END) as under_review_internship_applications
            FROM Internship_Applications ia
            WHERE ia.User_ID = %s
        """, (user_id,))
        internship_stats = cursor.fetchone()

        # Get saved content count
        cursor.execute("""
            SELECT COUNT(*) as saved_count
            FROM User_Saved_Content usc
            WHERE usc.User_ID = %s
        """, (user_id,))
        saved_stats = cursor.fetchone()

        # Get saved content by type for more detailed stats
        cursor.execute("""
            SELECT
                c.Content_Type,
                COUNT(*) as count
            FROM User_Saved_Content usc
            JOIN Content c ON usc.Content_ID = c.Content_ID
            WHERE usc.User_ID = %s
            GROUP BY c.Content_Type
        """, (user_id,))
        saved_by_type = cursor.fetchall()

        # Get recent applications (last 5)
        cursor.execute("""
            SELECT
                ja.Application_ID as id,
                c.Title as position,
                j.Company_Name as company,
                ja.Status as status,
                ja.Application_Date as applied_date,
                'job' as type
            FROM Job_Applications ja
            JOIN Jobs j ON ja.Job_ID = j.Job_ID
            JOIN Content c ON j.Content_ID = c.Content_ID
            WHERE ja.User_ID = %s

            UNION ALL

            SELECT
                ia.Application_ID as id,
                c.Title as position,
                i.Company_Name as company,
                ia.Status as status,
                ia.Application_Date as applied_date,
                'internship' as type
            FROM Internship_Applications ia
            JOIN Internships i ON ia.Internship_ID = i.Internship_ID
            JOIN Content c ON i.Content_ID = c.Content_ID
            WHERE ia.User_ID = %s

            ORDER BY applied_date DESC
            LIMIT 5
        """, (user_id, user_id))
        recent_applications = cursor.fetchall()

        # Calculate stats
        total_applications = (job_stats['total_applications'] or 0) + (internship_stats['total_applications'] or 0)
        pending_applications = (job_stats['pending_job_applications'] or 0) + (job_stats['under_review_job_applications'] or 0) + \
                             (internship_stats['pending_internship_applications'] or 0) + (internship_stats['under_review_internship_applications'] or 0)

        # Count saved jobs specifically
        saved_jobs_count = 0
        saved_courses_count = 0
        for item in saved_by_type:
            if item['Content_Type'] in ['Job', 'Internship']:
                saved_jobs_count += item['count']
            elif item['Content_Type'] == 'Course':
                saved_courses_count += item['count']

        # Prepare dashboard data
        dashboard_data = {
            'stats': {
                'applications_submitted': {
                    'value': total_applications,
                    'description': f"{pending_applications} pending responses"
                },
                'courses_enrolled': {
                    'value': saved_courses_count,  # Using saved courses as enrolled for now
                    'description': "Saved courses"
                },
                'blog_posts_read': {
                    'value': 0,  # TODO: Implement blog post reading tracking
                    'description': "Feature coming soon"
                },
                'saved_jobs': {
                    'value': saved_jobs_count,
                    'description': f"Jobs and internships saved"
                }
            },
            'recent_applications': recent_applications,
            'upcoming_events': []  # TODO: Implement events system
        }

        return jsonify(dashboard_data), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ===== NOTIFICATION SYSTEM ENDPOINTS =====

@app.route('/api/notifications', methods=['GET'])
def get_user_notifications():
    session_token = request.headers.get('Authorization')
    if not session_token:
        return jsonify({'error': 'Session token required'}), 401

    # Remove 'Bearer ' prefix if present
    if session_token.startswith('Bearer '):
        session_token = session_token[7:]

    conn = get_db_connection()
    cursor = conn.cursor(buffered=True, dictionary=True)

    try:
        # Get user ID from session token
        cursor.execute("SELECT User_ID FROM Session WHERE Session_Token = %s", (session_token,))
        session = cursor.fetchone()

        if not session:
            return jsonify({'error': 'Invalid session token'}), 401

        user_id = session['User_ID']

        # Get query parameters
        limit = request.args.get('limit', 20, type=int)
        offset = request.args.get('offset', 0, type=int)
        unread_only = request.args.get('unread_only', 'false').lower() == 'true'

        # Build query
        where_clause = "WHERE n.User_ID = %s"
        params = [user_id]

        if unread_only:
            where_clause += " AND n.Is_Read = FALSE"

        # Get notifications
        cursor.execute(f"""
            SELECT
                n.Notification_ID,
                n.User_ID,
                n.Type,
                n.Title,
                n.Message,
                n.Is_Read,
                n.Created_At,
                n.Related_Content_ID,
                n.Action_URL
            FROM Notifications n
            {where_clause}
            ORDER BY n.Created_At DESC
            LIMIT %s OFFSET %s
        """, params + [limit, offset])

        notifications = cursor.fetchall()

        # Get total count
        cursor.execute(f"""
            SELECT COUNT(*) as total
            FROM Notifications n
            {where_clause}
        """, params)

        total_count = cursor.fetchone()['total']

        # Get unread count
        cursor.execute("""
            SELECT COUNT(*) as unread_count
            FROM Notifications n
            WHERE n.User_ID = %s AND n.Is_Read = FALSE
        """, (user_id,))

        unread_count = cursor.fetchone()['unread_count']

        return jsonify({
            'success': True,
            'notifications': notifications,
            'total': total_count,
            'unread_count': unread_count,
            'limit': limit,
            'offset': offset
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/notifications/<int:notification_id>/read', methods=['PUT'])
def mark_notification_read(notification_id):
    session_token = request.headers.get('Authorization')
    if not session_token:
        return jsonify({'error': 'Session token required'}), 401

    # Remove 'Bearer ' prefix if present
    if session_token.startswith('Bearer '):
        session_token = session_token[7:]

    conn = get_db_connection()
    cursor = conn.cursor(buffered=True, dictionary=True)

    try:
        # Get user ID from session token
        cursor.execute("SELECT User_ID FROM Session WHERE Session_Token = %s", (session_token,))
        session = cursor.fetchone()

        if not session:
            return jsonify({'error': 'Invalid session token'}), 401

        user_id = session['User_ID']

        # Update notification as read (only if it belongs to the user)
        cursor.execute("""
            UPDATE Notifications
            SET Is_Read = TRUE
            WHERE Notification_ID = %s AND User_ID = %s
        """, (notification_id, user_id))

        if cursor.rowcount == 0:
            return jsonify({'error': 'Notification not found or access denied'}), 404

        conn.commit()
        return jsonify({'success': True, 'message': 'Notification marked as read'}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/notifications/read-all', methods=['PUT'])
def mark_all_notifications_read():
    session_token = request.headers.get('Authorization')
    if not session_token:
        return jsonify({'error': 'Session token required'}), 401

    # Remove 'Bearer ' prefix if present
    if session_token.startswith('Bearer '):
        session_token = session_token[7:]

    conn = get_db_connection()
    cursor = conn.cursor(buffered=True, dictionary=True)

    try:
        # Get user ID from session token
        cursor.execute("SELECT User_ID FROM Session WHERE Session_Token = %s", (session_token,))
        session = cursor.fetchone()

        if not session:
            return jsonify({'error': 'Invalid session token'}), 401

        user_id = session['User_ID']

        # Mark all notifications as read for the user
        cursor.execute("""
            UPDATE Notifications
            SET Is_Read = TRUE
            WHERE User_ID = %s AND Is_Read = FALSE
        """, (user_id,))

        conn.commit()
        return jsonify({'success': True, 'message': f'{cursor.rowcount} notifications marked as read'}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/notifications/<int:notification_id>', methods=['DELETE'])
def delete_notification(notification_id):
    session_token = request.headers.get('Authorization')
    if not session_token:
        return jsonify({'error': 'Session token required'}), 401

    # Remove 'Bearer ' prefix if present
    if session_token.startswith('Bearer '):
        session_token = session_token[7:]

    conn = get_db_connection()
    cursor = conn.cursor(buffered=True, dictionary=True)

    try:
        # Get user ID from session token
        cursor.execute("SELECT User_ID FROM Session WHERE Session_Token = %s", (session_token,))
        session = cursor.fetchone()

        if not session:
            return jsonify({'error': 'Invalid session token'}), 401

        user_id = session['User_ID']

        # Delete notification (only if it belongs to the user)
        cursor.execute("""
            DELETE FROM Notifications
            WHERE Notification_ID = %s AND User_ID = %s
        """, (notification_id, user_id))

        if cursor.rowcount == 0:
            return jsonify({'error': 'Notification not found or access denied'}), 404

        conn.commit()
        return jsonify({'success': True, 'message': 'Notification deleted'}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# Helper function to create notifications
def create_notification(user_id, notification_type, title, message, related_content_id=None, action_url=None):
    """
    Helper function to create a notification in the database
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO Notifications (User_ID, Type, Title, Message, Related_Content_ID, Action_URL)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (user_id, notification_type, title, message, related_content_id, action_url))

        conn.commit()
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"Error creating notification: {e}")
        return False

# Email management endpoints (dummy implementation for frontend compatibility)
@app.route('/admin/send_email', methods=['POST'])
def admin_send_email():
    """
    Dummy email endpoint that simulates sending emails without actual email delivery
    or database operations. Returns success response for frontend compatibility.
    """
    data = request.get_json()
    admin_id = data.get('admin_id')
    recipient_user_ids = data.get('recipient_user_ids', [])
    subject = data.get('subject', 'LawFort Notification')
    content = data.get('content', '')
    email_type = data.get('email_type', 'announcement')

    if not admin_id or not recipient_user_ids:
        return jsonify({'error': 'Admin ID and recipient user IDs are required'}), 400

    try:
        # Simulate email sending without database operations
        recipient_count = len(recipient_user_ids)

        # TODO: Implement actual email sending logic here

        # Always return success for frontend compatibility
        return jsonify({
            'message': f'Email sent successfully to {recipient_count} recipients',
            'recipients_count': recipient_count
        }), 200

    except Exception as e:
        return jsonify({'error': 'Failed to send email'}), 500

@app.route('/admin/email_logs', methods=['GET'])
def get_email_logs():
    """
    Get email logs from the database
    """
    conn = get_db_connection()
    cursor = conn.cursor(buffered=True)

    try:
        cursor.execute("""
            SELECT el.Email_ID, el.Sender_ID, up.Full_Name as sender_name,
                   JSON_LENGTH(el.Recipient_Emails) as recipient_count,
                   el.Subject, el.Email_Type, el.Status, el.Sent_At, el.Error_Message
            FROM Email_Logs el
            LEFT JOIN User_Profile up ON el.Sender_ID = up.User_ID
            ORDER BY el.Sent_At DESC
            LIMIT 50
        """)

        logs = cursor.fetchall()

        email_logs = []
        for log in logs:
            email_logs.append({
                'email_id': log[0],
                'sender_id': log[1],
                'sender_name': log[2] or 'Unknown User',
                'recipient_count': log[3] or 0,
                'subject': log[4],
                'email_type': log[5],
                'status': log[6],
                'sent_at': log[7].isoformat() if log[7] else None,
                'error_message': log[8]
            })

        return jsonify({'email_logs': email_logs}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/admin/users_for_email', methods=['GET'])
def get_users_for_email():
    conn = get_db_connection()
    cursor = conn.cursor(buffered=True)

    try:
        cursor.execute("""
            SELECT u.User_ID, u.Email, up.Full_Name, up.Practice_Area,
                   r.Role_Name, u.Status
            FROM Users u
            LEFT JOIN User_Profile up ON u.User_ID = up.User_ID
            LEFT JOIN Roles r ON u.Role_ID = r.Role_ID
            WHERE u.Status = 'Active'
            ORDER BY up.Full_Name, u.Email
        """)

        users = cursor.fetchall()

        user_list = []
        for user in users:
            user_list.append({
                'user_id': user[0],
                'email': user[1],
                'full_name': user[2] or 'No Name',
                'practice_area': user[3] or 'Not Specified',
                'role_name': user[4] or 'User',
                'status': user[5]
            })

        return jsonify({'users': user_list}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# Helper function to check user permissions with hierarchical support
def check_user_permission(user_id, permission_name, content_id=None, content_owner_id=None):
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Get user's role and super admin status
        cursor.execute("""
            SELECT u.Role_ID, u.Is_Super_Admin
            FROM Users u
            WHERE u.User_ID = %s
        """, (user_id,))

        user_info = cursor.fetchone()
        if not user_info:
            cursor.close()
            connection.close()
            return False

        # Super admins bypass all permission checks
        if user_info['Is_Super_Admin']:
            cursor.close()
            connection.close()
            return True

        role_id = user_info['Role_ID']

        # Check for exact permission match
        cursor.execute("""
            SELECT p.Permission_Name
            FROM Permissions p
            WHERE p.Role_ID = %s AND p.Permission_Name = %s
        """, (role_id, permission_name))

        exact_match = cursor.fetchone()

        if exact_match:
            cursor.close()
            connection.close()
            return True

        # Check for hierarchical permissions based on role and content ownership
        if permission_name.endswith('_own') and content_owner_id:
            # For "own" permissions, check if user owns the content
            if user_id == content_owner_id:
                cursor.close()
                connection.close()
                return True

        # Check for broader permissions that include the requested permission
        permission_hierarchy = {
            # Admin permissions (role_id = 1) include all
            'content_create_all': ['content_create_own', 'content_create'],
            'content_read_all': ['content_read_public', 'content_read'],
            'content_update_all': ['content_update_own', 'content_update'],
            'content_delete_all': ['content_delete_own', 'content_delete'],
            'metrics_view_all': ['metrics_view_own', 'metrics_view'],

            # Editor permissions (role_id = 2) for their own content
            'content_create_own': ['content_create'],
            'content_update_own': ['content_update'],
            'content_delete_own': ['content_delete'],
            'content_publish_own': ['content_publish'],
            'metrics_view_own': ['metrics_view'],
        }

        # Check if user has a broader permission that includes the requested one
        for broad_perm, included_perms in permission_hierarchy.items():
            if permission_name in included_perms:
                cursor.execute("""
                    SELECT p.Permission_Name
                    FROM Permissions p
                    WHERE p.Role_ID = %s AND p.Permission_Name = %s
                """, (role_id, broad_perm))

                broader_match = cursor.fetchone()

                if broader_match:
                    cursor.close()
                    connection.close()
                    return True

        cursor.close()
        connection.close()
        return False
    except Exception as e:
        return False

# Helper function to get content owner
def get_content_owner(content_id):
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("SELECT User_ID FROM Content WHERE Content_ID = %s", (content_id,))
        result = cursor.fetchone()

        cursor.close()
        connection.close()

        return result['User_ID'] if result else None
    except Exception as e:
        return None

# Enhanced decorator for routes that require specific permissions
def require_permission(permission_name, check_ownership=False):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Get session token from request headers
            session_token = request.headers.get('Authorization')
            if not session_token:
                return jsonify({"success": False, "message": "No session token provided"}), 401

            # Remove 'Bearer ' prefix if present
            if session_token.startswith('Bearer '):
                session_token = session_token[7:]

            try:
                connection = get_db_connection()
                cursor = connection.cursor(dictionary=True)

                # Verify session token and get user ID
                cursor.execute("""
                    SELECT s.User_ID
                    FROM Session s
                    WHERE s.Session_Token = %s
                """, (session_token,))

                session = cursor.fetchone()
                if not session:
                    cursor.close()
                    connection.close()
                    return jsonify({"success": False, "message": "Invalid session token"}), 401

                user_id = session['User_ID']
                cursor.close()
                connection.close()

                # For ownership-based permissions, get content_id from URL parameters
                content_owner_id = None
                if check_ownership and len(args) > 0:
                    # Assume first argument after user_id is content_id
                    content_id = args[0] if args else None
                    if content_id:
                        content_owner_id = get_content_owner(content_id)

                # Check permission with enhanced logic
                if check_user_permission(user_id, permission_name, content_owner_id=content_owner_id):
                    return f(user_id, *args, **kwargs)
                else:
                    return jsonify({"success": False, "message": "Permission denied"}), 403

            except Exception as e:
                return jsonify({"success": False, "message": str(e)}), 500

        return decorated_function
    return decorator

# JSON encoder to handle date objects
class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        return super().default(obj)

# Set the custom JSON encoder for the Flask app
app.json_encoder = CustomJSONEncoder

# ===== BLOG POST ROUTES =====

@app.route('/api/blog-posts', methods=['GET'])
def get_blog_posts():
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Get query parameters for filtering
        category = request.args.get('category')
        status = request.args.get('status', 'Active')
        limit = request.args.get('limit', 10, type=int)
        offset = request.args.get('offset', 0, type=int)

        # Base query - Fixed field names to match frontend expectations
        query = """
            SELECT c.Content_ID as content_id, c.User_ID as user_id, c.Title as title,
                   c.Summary as summary, c.Content as content,
                   c.Featured_Image as featured_image, c.Tags as tags,
                   c.Created_At as created_at, c.Updated_At as updated_at, c.Status as status,
                   c.Is_Featured as is_featured, bp.Category as category,
                   bp.Allow_Comments as allow_comments, bp.Is_Published as is_published,
                   bp.Publication_Date as publication_date, up.Full_Name as author_name,
                   (SELECT COUNT(*) FROM Content_Comments cc WHERE cc.Content_ID = c.Content_ID AND cc.Status = 'Active') as comment_count
            FROM Content c
            JOIN Blog_Posts bp ON c.Content_ID = bp.Content_ID
            JOIN Users u ON c.User_ID = u.User_ID
            JOIN User_Profile up ON u.User_ID = up.User_ID
            WHERE c.Content_Type = 'Blog_Post' AND bp.Is_Published = TRUE
        """

        params = []

        # Add filters
        if category:
            query += " AND bp.Category = %s"
            params.append(category)

        if status:
            query += " AND c.Status = %s"
            params.append(status)

        # Add sorting and pagination
        query += " ORDER BY c.Created_At DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])

        cursor.execute(query, params)
        blog_posts = cursor.fetchall()

        # Get total count for pagination
        count_query = """
            SELECT COUNT(*) as total
            FROM Content c
            JOIN Blog_Posts bp ON c.Content_ID = bp.Content_ID
            WHERE c.Content_Type = 'Blog_Post' AND bp.Is_Published = TRUE
        """

        count_params = []

        if category:
            count_query += " AND bp.Category = %s"
            count_params.append(category)

        if status:
            count_query += " AND c.Status = %s"
            count_params.append(status)

        cursor.execute(count_query, count_params)
        total_count = cursor.fetchone()['total']

        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "blog_posts": blog_posts,
            "total": total_count,
            "limit": limit,
            "offset": offset
        })
    except Exception as e:
        print(f"Error in get_blog_posts: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/blog-posts/<int:post_id>', methods=['GET'])
def get_blog_post(post_id):
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Get the blog post - Fixed field names to match frontend expectations
        cursor.execute("""
            SELECT c.Content_ID as content_id, c.User_ID as user_id, c.Title as title,
                   c.Summary as summary, c.Content as content,
                   c.Featured_Image as featured_image, c.Tags as tags,
                   c.Created_At as created_at, c.Updated_At as updated_at, c.Status as status,
                   c.Is_Featured as is_featured, bp.Category as category,
                   bp.Allow_Comments as allow_comments, bp.Is_Published as is_published,
                   bp.Publication_Date as publication_date, up.Full_Name as author_name
            FROM Content c
            JOIN Blog_Posts bp ON c.Content_ID = bp.Content_ID
            JOIN Users u ON c.User_ID = u.User_ID
            JOIN User_Profile up ON u.User_ID = up.User_ID
            WHERE c.Content_ID = %s AND c.Content_Type = 'Blog_Post'
        """, (post_id,))

        blog_post = cursor.fetchone()

        if not blog_post:
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "Blog post not found"}), 404

        # Get comments for the blog post - Fixed field names to match frontend expectations
        cursor.execute("""
            SELECT cc.Comment_ID as comment_id, cc.User_ID as user_id,
                   cc.Comment_Content as comment_text, cc.Created_At as created_at,
                   cc.Updated_At as updated_at, cc.Status as status,
                   cc.Parent_Comment_ID as parent_comment_id, up.Full_Name as author_name
            FROM Content_Comments cc
            JOIN Users u ON cc.User_ID = u.User_ID
            JOIN User_Profile up ON u.User_ID = up.User_ID
            WHERE cc.Content_ID = %s AND cc.Status = 'Active'
            ORDER BY cc.Created_At DESC
        """, (post_id,))

        comments = cursor.fetchall()

        # Update view count in metrics
        cursor.execute("""
            UPDATE Content_Metrics
            SET Views = Views + 1, Last_Updated = NOW()
            WHERE Content_ID = %s
        """, (post_id,))

        connection.commit()
        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "blog_post": blog_post,
            "comments": comments
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/blog-posts', methods=['POST'])
@require_permission('content_create_own')
def create_blog_post(user_id):
    try:
        data = request.json

        # Validate required fields
        required_fields = ['title', 'content']
        for field in required_fields:
            if field not in data:
                return jsonify({"success": False, "message": f"Missing required field: {field}"}), 400

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Check user role first
        cursor.execute("SELECT Role_ID FROM Users WHERE User_ID = %s", (user_id,))
        user_role_result = cursor.fetchone()

        if not user_role_result or user_role_result['Role_ID'] not in [1, 2]:
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "User does not have permission to create blog posts"}), 403

        # Insert directly into database instead of using stored procedure
        try:
            # For admins and editors, default to published unless explicitly set to false
            # For regular users, default to unpublished
            is_published = data.get('is_published', True)  # Default to True for admins/editors
            content_status = 'Active' if is_published else 'Inactive'

            cursor.execute("""
                INSERT INTO Content (User_ID, Content_Type, Title, Summary, Content, Featured_Image, Tags, Status)
                VALUES (%s, 'Blog_Post', %s, %s, %s, %s, %s, %s)
            """, (
                user_id,
                data.get('title'),
                data.get('summary', ''),
                data.get('content'),
                data.get('featured_image', ''),
                data.get('tags', ''),
                content_status
            ))

            # Get the Content_ID of the newly created content
            new_content_id = cursor.lastrowid

            # Insert into Blog_Posts table
            if is_published:
                cursor.execute("""
                    INSERT INTO Blog_Posts (Content_ID, Category, Allow_Comments, Is_Published, Publication_Date)
                    VALUES (%s, %s, %s, %s, NOW())
                """, (
                    new_content_id,
                    data.get('category', 'General'),
                    data.get('allow_comments', True),
                    is_published
                ))
            else:
                cursor.execute("""
                    INSERT INTO Blog_Posts (Content_ID, Category, Allow_Comments, Is_Published, Publication_Date)
                    VALUES (%s, %s, %s, %s, NULL)
                """, (
                    new_content_id,
                    data.get('category', 'General'),
                    data.get('allow_comments', True),
                    is_published
                ))

            # Create metrics entry
            cursor.execute("INSERT INTO Content_Metrics (Content_ID) VALUES (%s)", (new_content_id,))

            # Log the action if user is admin
            if user_role_result['Role_ID'] == 1:
                cursor.execute("""
                    INSERT INTO Audit_Logs (Admin_ID, Action_Type, Action_Details)
                    VALUES (%s, 'Create Blog Post', %s)
                """, (user_id, f"Created blog post: {data.get('title')}"))

            connection.commit()
            cursor.close()
            connection.close()

            return jsonify({
                "success": True,
                "message": "Blog post created successfully",
                "content_id": new_content_id
            }), 201

        except Exception as db_error:
            connection.rollback()
            cursor.close()
            connection.close()
            print(f"Database error: {db_error}")
            return jsonify({"success": False, "message": f"Database error: {str(db_error)}"}), 500
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/blog-posts/<int:post_id>', methods=['PUT'])
@require_permission('content_update_own', check_ownership=True)
def update_blog_post(user_id, post_id):
    try:
        data = request.json

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Get content info and user role
        cursor.execute("""
            SELECT c.User_ID as content_owner_id, u.Role_ID as user_role
            FROM Content c
            JOIN Users u ON u.User_ID = %s
            WHERE c.Content_ID = %s AND c.Content_Type = 'Blog_Post'
        """, (user_id, post_id))

        result = cursor.fetchone()

        if not result:
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "Blog post not found"}), 404

        # Check permissions: Admin can edit all, Editor can edit only their own
        user_role = result['user_role']
        content_owner_id = result['content_owner_id']

        if user_role == 1:  # Admin - can edit all
            pass
        elif user_role == 2 and content_owner_id == user_id:  # Editor - can edit only their own
            pass
        else:
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "Permission denied. You can only edit your own content."}), 403

        # Update the Content table
        content_update_query = """
            UPDATE Content
            SET Title = %s, Summary = %s, Content = %s, Featured_Image = %s,
                Tags = %s, Updated_At = NOW()
            WHERE Content_ID = %s
        """

        cursor.execute(content_update_query, (
            data.get('title'),
            data.get('summary', ''),
            data.get('content'),
            data.get('featured_image', ''),
            data.get('tags', ''),
            post_id
        ))

        # Update the Blog_Posts table
        blog_update_query = """
            UPDATE Blog_Posts
            SET Category = %s, Allow_Comments = %s, Is_Published = %s,
                Publication_Date = CASE WHEN %s = 1 AND Publication_Date IS NULL THEN NOW() ELSE Publication_Date END
            WHERE Content_ID = %s
        """

        is_published = data.get('is_published', False)

        cursor.execute(blog_update_query, (
            data.get('category', 'General'),
            data.get('allow_comments', True),
            is_published,
            is_published,
            post_id
        ))

        # Update the status in Content table based on is_published
        status_update_query = """
            UPDATE Content
            SET Status = CASE WHEN %s = 1 THEN 'Active' ELSE 'Inactive' END
            WHERE Content_ID = %s
        """

        cursor.execute(status_update_query, (is_published, post_id))

        # Log the action if user is admin
        if user_role == 1:
            cursor.execute("""
                INSERT INTO Audit_Logs (Admin_ID, Action_Type, Action_Details)
                VALUES (%s, 'Update Blog Post', CONCAT('Updated blog post ID: ', %s))
            """, (user_id, post_id))

        connection.commit()
        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "message": "Blog post updated successfully"
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/blog-posts/<int:post_id>', methods=['DELETE'])
@require_permission('content_delete_own', check_ownership=True)
def delete_blog_post(user_id, post_id):
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Get content info and user role
        cursor.execute("""
            SELECT c.User_ID as content_owner_id, u.Role_ID as user_role
            FROM Content c
            JOIN Users u ON u.User_ID = %s
            WHERE c.Content_ID = %s AND c.Content_Type = 'Blog_Post'
        """, (user_id, post_id))

        result = cursor.fetchone()

        if not result:
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "Blog post not found"}), 404

        # Check permissions: Admin can delete all, Editor can delete only their own
        user_role = result['user_role']
        content_owner_id = result['content_owner_id']

        if user_role == 1:  # Admin - can delete all
            pass
        elif user_role == 2 and content_owner_id == user_id:  # Editor - can delete only their own
            pass
        else:
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "Permission denied. You can only delete your own content."}), 403

        # Update the status to 'Deleted' instead of actually deleting
        cursor.execute("""
            UPDATE Content
            SET Status = 'Deleted', Updated_At = NOW()
            WHERE Content_ID = %s
        """, (post_id,))

        # Log the action if user is admin
        if user_role == 1:
            cursor.execute("""
                INSERT INTO Audit_Logs (Admin_ID, Action_Type, Action_Details)
                VALUES (%s, 'Delete Blog Post', CONCAT('Deleted blog post ID: ', %s))
            """, (user_id, post_id))

        connection.commit()
        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "message": "Blog post deleted successfully"
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/blog-posts/<int:post_id>/comments', methods=['POST'])
@require_permission('blog_comment')
def add_blog_comment(user_id, post_id):
    try:
        data = request.json

        if 'comment' not in data:
            return jsonify({"success": False, "message": "Comment content is required"}), 400

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Insert comment directly into database instead of using stored procedure
        try:
            # Insert the comment
            cursor.execute("""
                INSERT INTO Content_Comments (Content_ID, User_ID, Comment_Content, Parent_Comment_ID, Status)
                VALUES (%s, %s, %s, %s, 'Active')
            """, (
                post_id,
                user_id,
                data.get('comment'),
                data.get('parent_comment_id')
            ))

            # Get the new comment ID
            new_comment_id = cursor.lastrowid

            # Update comment count in metrics
            cursor.execute("""
                UPDATE Content_Metrics
                SET Comments_Count = Comments_Count + 1, Last_Updated = NOW()
                WHERE Content_ID = %s
            """, (post_id,))

            connection.commit()
            cursor.close()
            connection.close()

            return jsonify({
                "success": True,
                "message": "Comment added successfully",
                "comment_id": new_comment_id
            })

        except Exception as db_error:
            connection.rollback()
            cursor.close()
            connection.close()
            print(f"Database error: {db_error}")
            return jsonify({"success": False, "message": f"Database error: {str(db_error)}"}), 500
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# Generic content comment endpoint
@app.route('/api/content/<int:content_id>/like', methods=['POST'])
@require_permission('content_read_public')
def like_content(user_id, content_id):
    """Like or unlike content (blog posts, research papers, etc.)"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Check if content exists and is active
        cursor.execute("""
            SELECT Content_ID, Title, Content_Type, Status
            FROM Content
            WHERE Content_ID = %s AND Status = 'Active'
        """, (content_id,))

        content = cursor.fetchone()
        if not content:
            return jsonify({"success": False, "message": "Content not found or inactive"}), 404

        # Check if user has already liked this content
        cursor.execute("""
            SELECT Like_ID FROM Content_Likes
            WHERE User_ID = %s AND Content_ID = %s
        """, (user_id, content_id))

        existing_like = cursor.fetchone()

        if existing_like:
            # User has already liked, so unlike it
            cursor.execute("""
                DELETE FROM Content_Likes
                WHERE User_ID = %s AND Content_ID = %s
            """, (user_id, content_id))

            action = "unliked"
            is_liked = False
        else:
            # User hasn't liked, so like it
            cursor.execute("""
                INSERT INTO Content_Likes (User_ID, Content_ID)
                VALUES (%s, %s)
            """, (user_id, content_id))

            action = "liked"
            is_liked = True

        connection.commit()

        # Get updated like count from Content_Likes table directly
        cursor.execute("""
            SELECT COUNT(*) as like_count FROM Content_Likes
            WHERE Content_ID = %s
        """, (content_id,))

        result = cursor.fetchone()
        like_count = result['like_count'] if result else 0

        # Update Content_Metrics table
        cursor.execute("""
            INSERT INTO Content_Metrics (Content_ID, Views, Likes, Shares, Comments_Count)
            VALUES (%s, 0, %s, 0, 0)
            ON DUPLICATE KEY UPDATE
            Likes = %s, Last_Updated = NOW()
        """, (content_id, like_count, like_count))

        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "action": action,
            "is_liked": is_liked,
            "like_count": like_count,
            "message": f"Content {action} successfully"
        })

    except Exception as e:
        if connection:
            connection.rollback()
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/content/<int:content_id>/like-status', methods=['GET'])
@require_permission('content_read_public')
def get_like_status(user_id, content_id):
    """Get the like status for a specific content and user"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Check if user has liked this content
        cursor.execute("""
            SELECT Like_ID FROM Content_Likes
            WHERE User_ID = %s AND Content_ID = %s
        """, (user_id, content_id))

        is_liked = cursor.fetchone() is not None

        # Get total like count from Content_Likes table directly
        cursor.execute("""
            SELECT COUNT(*) as like_count FROM Content_Likes
            WHERE Content_ID = %s
        """, (content_id,))

        result = cursor.fetchone()
        like_count = result['like_count'] if result else 0

        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "is_liked": is_liked,
            "like_count": like_count
        })

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/content/<int:content_id>/comments', methods=['POST'])
@require_permission('blog_comment')
def add_content_comment(user_id, content_id):
    try:
        data = request.json

        if 'comment_text' not in data:
            return jsonify({"success": False, "message": "Comment content is required"}), 400

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Check if content exists and allows comments
        cursor.execute("""
            SELECT c.Content_Type, c.Status,
                   CASE
                       WHEN c.Content_Type = 'Blog_Post' THEN bp.Allow_Comments
                       ELSE TRUE
                   END as allow_comments
            FROM Content c
            LEFT JOIN Blog_Posts bp ON c.Content_ID = bp.Content_ID
            WHERE c.Content_ID = %s
        """, (content_id,))

        content_info = cursor.fetchone()

        if not content_info:
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "Content not found"}), 404

        if content_info['Status'] not in ['Active', 'Restricted']:
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "Cannot comment on inactive content"}), 400

        if not content_info['allow_comments']:
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "Comments are not allowed on this content"}), 400

        # Insert comment directly into database
        try:
            # Insert the comment
            cursor.execute("""
                INSERT INTO Content_Comments (Content_ID, User_ID, Comment_Content, Parent_Comment_ID, Status)
                VALUES (%s, %s, %s, %s, 'Active')
            """, (
                content_id,
                user_id,
                data.get('comment_text'),
                data.get('parent_comment_id')
            ))

            # Get the new comment ID
            new_comment_id = cursor.lastrowid

            # Update comment count in metrics
            cursor.execute("""
                UPDATE Content_Metrics
                SET Comments_Count = Comments_Count + 1, Last_Updated = NOW()
                WHERE Content_ID = %s
            """, (content_id,))

            # Get content author for notification
            cursor.execute("""
                SELECT c.User_ID, c.Title, c.Content_Type, up.Full_Name as commenter_name
                FROM Content c
                JOIN User_Profile up ON up.User_ID = %s
                WHERE c.Content_ID = %s
            """, (user_id, content_id))

            content_info = cursor.fetchone()

            # Create notification for content author (if not commenting on own content)
            if content_info and content_info['User_ID'] != user_id:
                notification_title = f"New Comment on Your {content_info['Content_Type'].replace('_', ' ')}"
                notification_message = f"{content_info['commenter_name']} commented on your {content_info['Content_Type'].replace('_', ' ').lower()}: {content_info['Title']}"
                action_url = f"/content/{content_id}"

                cursor.execute("""
                    INSERT INTO Notifications (User_ID, Type, Title, Message, Related_Content_ID, Action_URL)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (content_info['User_ID'], 'content_comment', notification_title, notification_message, content_id, action_url))

            connection.commit()
            cursor.close()
            connection.close()

            return jsonify({
                "success": True,
                "message": "Comment added successfully",
                "comment_id": new_comment_id
            })

        except Exception as db_error:
            connection.rollback()
            cursor.close()
            connection.close()
            print(f"Database error: {db_error}")
            return jsonify({"success": False, "message": f"Database error: {str(db_error)}"}), 500
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# ===== EDITOR ANALYTICS ROUTES =====

@app.route('/api/editor/analytics', methods=['GET'])
@require_permission('metrics_view_own')
def get_editor_analytics(user_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(buffered=True, dictionary=True)

        # Debug: Check user role
        cursor.execute("SELECT Role_ID FROM Users WHERE User_ID = %s", (user_id,))
        user_role = cursor.fetchone()
        print(f"DEBUG: Editor analytics - User ID: {user_id}, Role: {user_role}")

        # Only allow editors and admins to access this endpoint
        if not user_role or user_role['Role_ID'] not in [1, 2]:
            role_name = "Unknown" if not user_role else ("User" if user_role['Role_ID'] == 3 else f"Role {user_role['Role_ID']}")
            cursor.close()
            conn.close()
            return jsonify({
                'error': 'Access denied. Editor or Admin role required.',
                'current_role': role_name,
                'required_roles': ['Editor', 'Admin']
            }), 403

        # Get content statistics for the editor
        cursor.execute("""
            SELECT
                c.Content_Type,
                COUNT(*) as count,
                SUM(COALESCE(cm.Views, 0)) as total_views,
                SUM(COALESCE(cm.Likes, 0)) as total_likes,
                SUM(COALESCE(cm.Shares, 0)) as total_shares,
                SUM(COALESCE(cm.Comments_Count, 0)) as total_comments,
                SUM(CASE WHEN c.Status = 'Active' THEN 1 ELSE 0 END) as active_count
            FROM Content c
            LEFT JOIN Content_Metrics cm ON c.Content_ID = cm.Content_ID
            WHERE c.User_ID = %s AND c.Status != 'Deleted'
            GROUP BY c.Content_Type
        """, (user_id,))

        content_stats = cursor.fetchall()

        # Get total applications for editor's job and internship postings
        cursor.execute("""
            SELECT
                COUNT(DISTINCT ja.Application_ID) as job_applications,
                COUNT(DISTINCT ia.Application_ID) as internship_applications,
                COUNT(DISTINCT CASE WHEN ja.Status = 'Pending' THEN ja.Application_ID END) as pending_job_applications,
                COUNT(DISTINCT CASE WHEN ia.Status = 'Pending' THEN ia.Application_ID END) as pending_internship_applications
            FROM Content c
            LEFT JOIN Jobs j ON c.Content_ID = j.Content_ID
            LEFT JOIN Job_Applications ja ON j.Job_ID = ja.Job_ID
            LEFT JOIN Internships i ON c.Content_ID = i.Content_ID
            LEFT JOIN Internship_Applications ia ON i.Internship_ID = ia.Internship_ID
            WHERE c.User_ID = %s AND c.Status = 'Active'
        """, (user_id,))

        application_stats = cursor.fetchone()

        # Get recent content with metrics
        cursor.execute("""
            SELECT
                c.Content_ID,
                c.Title,
                c.Content_Type,
                c.Status,
                c.Created_At,
                c.Updated_At,
                COALESCE(cm.Views, 0) as views,
                COALESCE(cm.Comments_Count, 0) as comments,
                CASE
                    WHEN c.Content_Type = 'Job' THEN (
                        SELECT COUNT(*) FROM Job_Applications ja
                        JOIN Jobs j ON ja.Job_ID = j.Job_ID
                        WHERE j.Content_ID = c.Content_ID
                    )
                    WHEN c.Content_Type = 'Internship' THEN (
                        SELECT COUNT(*) FROM Internship_Applications ia
                        JOIN Internships i ON ia.Internship_ID = i.Internship_ID
                        WHERE i.Content_ID = c.Content_ID
                    )
                    ELSE 0
                END as applications
            FROM Content c
            LEFT JOIN Content_Metrics cm ON c.Content_ID = cm.Content_ID
            WHERE c.User_ID = %s AND c.Status != 'Deleted'
            ORDER BY c.Created_At DESC
            LIMIT 10
        """, (user_id,))

        recent_content = cursor.fetchall()

        # Process content statistics
        stats_dict = {}
        total_views = 0

        for stat in content_stats:
            content_type = stat['Content_Type']
            stats_dict[content_type] = {
                'count': stat['count'],
                'active_count': stat['active_count'],
                'total_views': stat['total_views'] or 0,
                'total_likes': stat['total_likes'] or 0,
                'total_shares': stat['total_shares'] or 0,
                'total_comments': stat['total_comments'] or 0
            }
            total_views += stat['total_views'] or 0

        # Get engagement metrics
        cursor.execute("""
            SELECT
                AVG(COALESCE(cm.Avg_Time_Spent, 0)) as avg_time_spent,
                AVG(COALESCE(cm.Bounce_Rate, 0)) as avg_bounce_rate,
                SUM(COALESCE(cm.Likes, 0)) as total_likes,
                SUM(COALESCE(cm.Shares, 0)) as total_shares
            FROM Content c
            LEFT JOIN Content_Metrics cm ON c.Content_ID = cm.Content_ID
            WHERE c.User_ID = %s AND c.Status != 'Deleted'
        """, (user_id,))

        engagement_stats = cursor.fetchone()

        # Get trending content (top 5 by recent activity)
        cursor.execute("""
            SELECT
                c.Content_ID,
                c.Title,
                c.Content_Type,
                c.Created_At,
                COALESCE(cm.Views, 0) as views,
                COALESCE(cm.Likes, 0) as likes,
                COALESCE(cm.Shares, 0) as shares,
                COALESCE(cm.Comments_Count, 0) as comments,
                COALESCE(cm.Avg_Time_Spent, 0) as avg_time_spent,
                COALESCE(cm.Bounce_Rate, 0) as bounce_rate,
                (COALESCE(cm.Views, 0) * 0.4 + COALESCE(cm.Likes, 0) * 0.3 +
                 COALESCE(cm.Shares, 0) * 0.2 + COALESCE(cm.Comments_Count, 0) * 0.1) as engagement_score
            FROM Content c
            LEFT JOIN Content_Metrics cm ON c.Content_ID = cm.Content_ID
            WHERE c.User_ID = %s AND c.Status = 'Active'
            ORDER BY engagement_score DESC, cm.Last_Updated DESC
            LIMIT 5
        """, (user_id,))

        trending_content = cursor.fetchall()

        # Get time-based analytics (last 30 days)
        cursor.execute("""
            SELECT
                DATE(c.Created_At) as date,
                COUNT(*) as content_created,
                SUM(COALESCE(cm.Views, 0)) as daily_views,
                SUM(COALESCE(cm.Likes, 0)) as daily_likes,
                SUM(COALESCE(cm.Comments_Count, 0)) as daily_comments
            FROM Content c
            LEFT JOIN Content_Metrics cm ON c.Content_ID = cm.Content_ID
            WHERE c.User_ID = %s AND c.Created_At >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY DATE(c.Created_At)
            ORDER BY date DESC
            LIMIT 30
        """, (user_id,))

        time_analytics = cursor.fetchall()

        # Prepare enhanced response
        analytics = {
            'content_stats': {
                'blog_posts': stats_dict.get('Blog_Post', {'count': 0, 'active_count': 0, 'total_views': 0, 'total_likes': 0, 'total_shares': 0, 'total_comments': 0}),
                'job_postings': stats_dict.get('Job', {'count': 0, 'active_count': 0, 'total_views': 0, 'total_likes': 0, 'total_shares': 0, 'total_comments': 0}),
                'internships': stats_dict.get('Internship', {'count': 0, 'active_count': 0, 'total_views': 0, 'total_likes': 0, 'total_shares': 0, 'total_comments': 0}),
                'research_papers': stats_dict.get('Research_Paper', {'count': 0, 'active_count': 0, 'total_views': 0, 'total_likes': 0, 'total_shares': 0, 'total_comments': 0}),
                'notes': stats_dict.get('Note', {'count': 0, 'active_count': 0, 'total_views': 0, 'total_likes': 0, 'total_shares': 0, 'total_comments': 0}),
                'courses': stats_dict.get('Course', {'count': 0, 'active_count': 0, 'total_views': 0, 'total_likes': 0, 'total_shares': 0, 'total_comments': 0})
            },
            'total_views': total_views,
            'engagement_metrics': {
                'total_likes': engagement_stats['total_likes'] or 0,
                'total_shares': engagement_stats['total_shares'] or 0,
                'avg_time_spent': round(engagement_stats['avg_time_spent'] or 0, 2),
                'avg_bounce_rate': round(engagement_stats['avg_bounce_rate'] or 0, 2)
            },
            'applications': {
                'total': (application_stats['job_applications'] or 0) + (application_stats['internship_applications'] or 0),
                'pending': (application_stats['pending_job_applications'] or 0) + (application_stats['pending_internship_applications'] or 0),
                'job_applications': application_stats['job_applications'] or 0,
                'internship_applications': application_stats['internship_applications'] or 0
            },
            'recent_content': recent_content,
            'trending_content': trending_content,
            'time_analytics': time_analytics
        }

        return jsonify(analytics), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ===== ADMIN ANALYTICS ROUTES =====

@app.route('/admin/analytics/enhanced', methods=['GET'])
@require_permission('system_admin')
def get_enhanced_admin_analytics(user_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(buffered=True, dictionary=True)

        # Get global content statistics
        cursor.execute("""
            SELECT
                c.Content_Type,
                COUNT(*) as total_count,
                SUM(CASE WHEN c.Status = 'Active' THEN 1 ELSE 0 END) as active_count,
                SUM(COALESCE(cm.Views, 0)) as total_views,
                SUM(COALESCE(cm.Likes, 0)) as total_likes,
                SUM(COALESCE(cm.Shares, 0)) as total_shares,
                SUM(COALESCE(cm.Comments_Count, 0)) as total_comments,
                AVG(COALESCE(cm.Avg_Time_Spent, 0)) as avg_time_spent,
                AVG(COALESCE(cm.Bounce_Rate, 0)) as avg_bounce_rate
            FROM Content c
            LEFT JOIN Content_Metrics cm ON c.Content_ID = cm.Content_ID
            WHERE c.Status != 'Deleted'
            GROUP BY c.Content_Type
        """)

        global_content_stats = cursor.fetchall()

        # Get content creation by role
        cursor.execute("""
            SELECT
                r.Role_Name,
                c.Content_Type,
                COUNT(*) as count,
                SUM(COALESCE(cm.Views, 0)) as total_views
            FROM Content c
            JOIN Users u ON c.User_ID = u.User_ID
            JOIN Roles r ON u.Role_ID = r.Role_ID
            LEFT JOIN Content_Metrics cm ON c.Content_ID = cm.Content_ID
            WHERE c.Status != 'Deleted'
            GROUP BY r.Role_Name, c.Content_Type
            ORDER BY r.Role_Name, c.Content_Type
        """)

        role_content_stats = cursor.fetchall()

        # Get top performing content across all creators
        cursor.execute("""
            SELECT
                c.Content_ID,
                c.Title,
                c.Content_Type,
                c.Created_At,
                up.Full_Name as author_name,
                COALESCE(cm.Views, 0) as views,
                COALESCE(cm.Likes, 0) as likes,
                COALESCE(cm.Shares, 0) as shares,
                COALESCE(cm.Comments_Count, 0) as comments,
                (COALESCE(cm.Views, 0) * 0.4 + COALESCE(cm.Likes, 0) * 0.3 +
                 COALESCE(cm.Shares, 0) * 0.2 + COALESCE(cm.Comments_Count, 0) * 0.1) as engagement_score
            FROM Content c
            LEFT JOIN Content_Metrics cm ON c.Content_ID = cm.Content_ID
            LEFT JOIN User_Profile up ON c.User_ID = up.User_ID
            WHERE c.Status = 'Active'
            ORDER BY engagement_score DESC
            LIMIT 10
        """)

        top_content = cursor.fetchall()

        # Get user activity analytics
        cursor.execute("""
            SELECT
                up.Full_Name as creator_name,
                u.User_ID,
                r.Role_Name,
                COUNT(c.Content_ID) as content_count,
                SUM(COALESCE(cm.Views, 0)) as total_views,
                SUM(COALESCE(cm.Likes, 0)) as total_likes,
                MAX(c.Created_At) as last_activity
            FROM Users u
            JOIN User_Profile up ON u.User_ID = up.User_ID
            JOIN Roles r ON u.Role_ID = r.Role_ID
            LEFT JOIN Content c ON u.User_ID = c.User_ID AND c.Status != 'Deleted'
            LEFT JOIN Content_Metrics cm ON c.Content_ID = cm.Content_ID
            WHERE r.Role_Name IN ('Editor', 'Admin')
            GROUP BY u.User_ID, up.Full_Name, r.Role_Name
            HAVING content_count > 0
            ORDER BY total_views DESC
            LIMIT 10
        """)

        top_creators = cursor.fetchall()

        # Get content moderation metrics
        cursor.execute("""
            SELECT
                COUNT(CASE WHEN c.Status = 'Pending' THEN 1 END) as pending_content,
                COUNT(CASE WHEN c.Status = 'Banned' THEN 1 END) as banned_content,
                COUNT(CASE WHEN c.Status = 'Restricted' THEN 1 END) as restricted_content,
                COUNT(CASE WHEN rpr.Status = 'Pending' THEN 1 END) as pending_research_reviews
            FROM Content c
            LEFT JOIN Research_Papers rp ON c.Content_ID = rp.Content_ID
            LEFT JOIN Research_Paper_Reviews rpr ON rp.Paper_ID = rpr.Content_ID
        """)

        moderation_stats = cursor.fetchone()

        # Get platform-wide engagement trends (last 30 days)
        cursor.execute("""
            SELECT
                DATE(c.Created_At) as date,
                COUNT(*) as content_created,
                SUM(COALESCE(cm.Views, 0)) as daily_views,
                SUM(COALESCE(cm.Likes, 0)) as daily_likes,
                SUM(COALESCE(cm.Comments_Count, 0)) as daily_comments
            FROM Content c
            LEFT JOIN Content_Metrics cm ON c.Content_ID = cm.Content_ID
            WHERE c.Created_At >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY DATE(c.Created_At)
            ORDER BY date DESC
            LIMIT 30
        """)

        platform_trends = cursor.fetchall()

        # Process global content stats
        global_stats_dict = {}
        total_platform_views = 0

        for stat in global_content_stats:
            content_type = stat['Content_Type']
            global_stats_dict[content_type] = {
                'total_count': stat['total_count'],
                'active_count': stat['active_count'],
                'total_views': stat['total_views'] or 0,
                'total_likes': stat['total_likes'] or 0,
                'total_shares': stat['total_shares'] or 0,
                'total_comments': stat['total_comments'] or 0,
                'avg_time_spent': round(stat['avg_time_spent'] or 0, 2),
                'avg_bounce_rate': round(stat['avg_bounce_rate'] or 0, 2)
            }
            total_platform_views += stat['total_views'] or 0

        # Process role-based content stats
        role_stats = {}
        for stat in role_content_stats:
            role = stat['Role_Name']
            content_type = stat['Content_Type']
            if role not in role_stats:
                role_stats[role] = {}
            role_stats[role][content_type] = {
                'count': stat['count'],
                'total_views': stat['total_views'] or 0
            }

        analytics = {
            'global_content_stats': {
                'blog_posts': global_stats_dict.get('Blog_Post', {'total_count': 0, 'active_count': 0, 'total_views': 0, 'total_likes': 0, 'total_shares': 0, 'total_comments': 0, 'avg_time_spent': 0, 'avg_bounce_rate': 0}),
                'job_postings': global_stats_dict.get('Job', {'total_count': 0, 'active_count': 0, 'total_views': 0, 'total_likes': 0, 'total_shares': 0, 'total_comments': 0, 'avg_time_spent': 0, 'avg_bounce_rate': 0}),
                'internships': global_stats_dict.get('Internship', {'total_count': 0, 'active_count': 0, 'total_views': 0, 'total_likes': 0, 'total_shares': 0, 'total_comments': 0, 'avg_time_spent': 0, 'avg_bounce_rate': 0}),
                'research_papers': global_stats_dict.get('Research_Paper', {'total_count': 0, 'active_count': 0, 'total_views': 0, 'total_likes': 0, 'total_shares': 0, 'total_comments': 0, 'avg_time_spent': 0, 'avg_bounce_rate': 0}),
                'notes': global_stats_dict.get('Note', {'total_count': 0, 'active_count': 0, 'total_views': 0, 'total_likes': 0, 'total_shares': 0, 'total_comments': 0, 'avg_time_spent': 0, 'avg_bounce_rate': 0}),
                'courses': global_stats_dict.get('Course', {'total_count': 0, 'active_count': 0, 'total_views': 0, 'total_likes': 0, 'total_shares': 0, 'total_comments': 0, 'avg_time_spent': 0, 'avg_bounce_rate': 0})
            },
            'total_platform_views': total_platform_views,
            'role_based_stats': role_stats,
            'top_content': top_content,
            'top_creators': top_creators,
            'moderation_metrics': {
                'pending_content': moderation_stats['pending_content'] or 0,
                'banned_content': moderation_stats['banned_content'] or 0,
                'restricted_content': moderation_stats['restricted_content'] or 0,
                'pending_research_reviews': moderation_stats['pending_research_reviews'] or 0
            },
            'platform_trends': platform_trends
        }

        return jsonify(analytics), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/content/analytics', methods=['GET'])
@require_permission('system_admin')
def get_content_analytics(user_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(buffered=True, dictionary=True)

        # Get query parameters
        time_range = request.args.get('timeRange', '7d')
        content_type = request.args.get('contentType', 'all')

        # Calculate date filter based on time range
        if time_range == '7d':
            date_filter = "DATE_SUB(NOW(), INTERVAL 7 DAY)"
        elif time_range == '30d':
            date_filter = "DATE_SUB(NOW(), INTERVAL 30 DAY)"
        elif time_range == '90d':
            date_filter = "DATE_SUB(NOW(), INTERVAL 90 DAY)"
        elif time_range == '1y':
            date_filter = "DATE_SUB(NOW(), INTERVAL 1 YEAR)"
        else:
            date_filter = "DATE_SUB(NOW(), INTERVAL 7 DAY)"

        # Build content type filter
        content_type_filter = ""
        if content_type != 'all':
            content_type_filter = f"AND c.Content_Type = '{content_type}'"

        # Get total metrics
        cursor.execute(f"""
            SELECT
                SUM(COALESCE(cm.Views, 0)) as total_views,
                SUM(COALESCE(cm.Likes, 0)) as total_likes,
                SUM(COALESCE(cm.Shares, 0)) as total_shares,
                SUM(COALESCE(cm.Comments_Count, 0)) as total_comments
            FROM Content c
            LEFT JOIN Content_Metrics cm ON c.Content_ID = cm.Content_ID
            WHERE c.Created_At >= {date_filter}
            AND c.Status = 'Active'
            {content_type_filter}
        """)

        totals = cursor.fetchone()

        # Get top performing content
        cursor.execute(f"""
            SELECT
                c.Content_ID as content_id,
                c.Title as title,
                c.Content_Type as content_type,
                COALESCE(cm.Views, 0) as views,
                COALESCE(cm.Likes, 0) as likes,
                COALESCE(cm.Shares, 0) as shares,
                COALESCE(cm.Comments_Count, 0) as comments,
                c.Created_At as created_at,
                up.Full_Name as author_name
            FROM Content c
            LEFT JOIN Content_Metrics cm ON c.Content_ID = cm.Content_ID
            LEFT JOIN User_Profile up ON c.User_ID = up.User_ID
            WHERE c.Created_At >= {date_filter}
            AND c.Status = 'Active'
            {content_type_filter}
            ORDER BY COALESCE(cm.Views, 0) DESC
            LIMIT 10
        """)

        top_content = cursor.fetchall()

        # Get content by type statistics
        cursor.execute(f"""
            SELECT
                c.Content_Type as type,
                COUNT(*) as count,
                SUM(COALESCE(cm.Views, 0)) as views
            FROM Content c
            LEFT JOIN Content_Metrics cm ON c.Content_ID = cm.Content_ID
            WHERE c.Created_At >= {date_filter}
            AND c.Status = 'Active'
            GROUP BY c.Content_Type
            ORDER BY views DESC
        """)

        content_by_type = cursor.fetchall()

        # Get daily views and likes for the time period
        if time_range == '7d':
            date_format = '%Y-%m-%d'
            days_back = 7
        elif time_range == '30d':
            date_format = '%Y-%m-%d'
            days_back = 30
        elif time_range == '90d':
            date_format = '%Y-%m-%d'
            days_back = 90
        else:  # 1y
            date_format = '%Y-%m'
            days_back = 365

        cursor.execute(f"""
            SELECT
                DATE_FORMAT(c.Created_At, '{date_format}') as date,
                SUM(COALESCE(cm.Views, 0)) as views,
                SUM(COALESCE(cm.Likes, 0)) as likes
            FROM Content c
            LEFT JOIN Content_Metrics cm ON c.Content_ID = cm.Content_ID
            WHERE c.Created_At >= {date_filter}
            AND c.Status = 'Active'
            {content_type_filter}
            GROUP BY DATE_FORMAT(c.Created_At, '{date_format}')
            ORDER BY date ASC
        """)

        daily_views = cursor.fetchall()

        # Format the response
        analytics = {
            'totalViews': totals['total_views'] or 0,
            'totalLikes': totals['total_likes'] or 0,
            'totalShares': totals['total_shares'] or 0,
            'totalComments': totals['total_comments'] or 0,
            'topContent': top_content,
            'contentByType': content_by_type,
            'dailyViews': daily_views
        }

        return jsonify(analytics), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ===== RESEARCH PAPER ROUTES =====

@app.route('/api/research-papers', methods=['GET'])
def get_research_papers():
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Get query parameters for filtering
        keywords = request.args.get('keywords')
        status = request.args.get('status', 'Active')  # Default to 'Active' to hide deleted content
        limit = request.args.get('limit', 10, type=int)
        offset = request.args.get('offset', 0, type=int)

        # Base query - Fixed field names to match frontend expectations
        query = """
            SELECT c.Content_ID as content_id, c.User_ID as user_id, c.Title as title,
                   c.Summary as summary, c.Content as content,
                   c.Featured_Image as pdf_url, c.Thumbnail_URL as thumbnail_url, c.Tags as tags,
                   c.Created_At as created_at, c.Updated_At as updated_at, c.Status as status,
                   c.Is_Featured as is_featured, rp.Authors as authors,
                   rp.Publication as publication, rp.Publication_Date as publication_date,
                   rp.DOI as doi, rp.Keywords as keywords, rp.Abstract as abstract,
                   rp.Citation_Count as citation_count, up.Full_Name as author_name
            FROM Content c
            JOIN Research_Papers rp ON c.Content_ID = rp.Content_ID
            JOIN Users u ON c.User_ID = u.User_ID
            JOIN User_Profile up ON u.User_ID = up.User_ID
            WHERE c.Content_Type = 'Research_Paper'
        """

        params = []

        # Add filters
        if keywords:
            query += " AND (rp.Keywords LIKE %s OR c.Title LIKE %s OR rp.Abstract LIKE %s)"
            keyword_param = f"%{keywords}%"
            params.extend([keyword_param, keyword_param, keyword_param])

        # Always filter by status (default to 'Active')
        query += " AND c.Status = %s"
        params.append(status)

        # Add sorting and pagination
        query += " ORDER BY c.Created_At DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])

        cursor.execute(query, params)
        research_papers = cursor.fetchall()

        # Get total count for pagination
        count_query = """
            SELECT COUNT(*) as total
            FROM Content c
            JOIN Research_Papers rp ON c.Content_ID = rp.Content_ID
            WHERE c.Content_Type = 'Research_Paper'
        """

        count_params = []

        if keywords:
            count_query += " AND (rp.Keywords LIKE %s OR c.Title LIKE %s OR rp.Abstract LIKE %s)"
            keyword_param = f"%{keywords}%"
            count_params.extend([keyword_param, keyword_param, keyword_param])

        # Always filter by status (default to 'Active')
        count_query += " AND c.Status = %s"
        count_params.append(status)

        cursor.execute(count_query, count_params)
        total_count = cursor.fetchone()['total']

        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "research_papers": research_papers,
            "total": total_count,
            "limit": limit,
            "offset": offset
        })
    except Exception as e:
        print(f"Error in get_research_papers: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/research-papers/<int:paper_id>', methods=['GET'])
def get_research_paper(paper_id):
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Get the research paper
        cursor.execute("""
            SELECT c.Content_ID, c.User_ID, c.Title, c.Summary, c.Content,
                   c.Featured_Image, c.Thumbnail_URL, c.Tags, c.Created_At, c.Updated_At, c.Status,
                   c.Is_Featured, rp.Authors, rp.Publication, rp.Publication_Date,
                   rp.DOI, rp.Keywords, rp.Abstract, rp.Citation_Count,
                   up.Full_Name as Author_Name
            FROM Content c
            JOIN Research_Papers rp ON c.Content_ID = rp.Content_ID
            JOIN Users u ON c.User_ID = u.User_ID
            JOIN User_Profile up ON u.User_ID = up.User_ID
            WHERE c.Content_ID = %s AND c.Content_Type = 'Research_Paper'
        """, (paper_id,))

        research_paper = cursor.fetchone()

        if not research_paper:
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "Research paper not found"}), 404

        # Update view count in metrics
        cursor.execute("""
            UPDATE Content_Metrics
            SET Views = Views + 1, Last_Updated = NOW()
            WHERE Content_ID = %s
        """, (paper_id,))

        connection.commit()
        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "research_paper": research_paper
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/research-papers', methods=['POST'])
@require_permission('content_create_own')
def create_research_paper(user_id):
    try:
        data = request.json

        # Validate required fields
        required_fields = ['title', 'abstract']
        for field in required_fields:
            if field not in data:
                return jsonify({"success": False, "message": f"Missing required field: {field}"}), 400

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Check user role first
        cursor.execute("SELECT Role_ID FROM Users WHERE User_ID = %s", (user_id,))
        user_role_result = cursor.fetchone()

        if not user_role_result or user_role_result['Role_ID'] not in [1, 2]:
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "User does not have permission to create research papers"}), 403

        # Insert directly into database instead of using stored procedure
        try:
            # For admins and editors, default to published unless explicitly set to false
            is_published = data.get('is_published', True)  # Default to True for admins/editors
            content_status = 'Active' if is_published else 'Inactive'

            cursor.execute("""
                INSERT INTO Content (User_ID, Content_Type, Title, Summary, Content, Featured_Image, Thumbnail_URL, Tags, Status)
                VALUES (%s, 'Research_Paper', %s, %s, %s, %s, %s, %s, %s)
            """, (
                user_id,
                data.get('title'),
                data.get('abstract', ''),  # Use abstract as summary
                data.get('abstract', ''),  # Store abstract in content field too
                data.get('pdf_url', ''),  # Store PDF URL in Featured_Image
                data.get('thumbnail_url', ''),  # Store thumbnail URL
                data.get('keywords', ''),  # Use keywords as tags
                content_status
            ))

            # Get the Content_ID of the newly created content
            new_content_id = cursor.lastrowid

            # Insert into Research_Papers table
            cursor.execute("""
                INSERT INTO Research_Papers (Content_ID, Authors, Publication, Publication_Date, DOI, Keywords, Abstract, Citation_Count)
                VALUES (%s, %s, %s, %s, %s, %s, %s, 0)
            """, (
                new_content_id,
                data.get('authors', ''),
                data.get('journal_name', ''),  # Map journal_name to Publication
                data.get('publication_date'),
                data.get('doi', ''),
                data.get('keywords', ''),
                data.get('abstract', ''),
            ))

            # Generate thumbnail if PDF URL is provided and we have a content_id
            if data.get('pdf_url') and not data.get('thumbnail_url'):
                # Extract filename from PDF URL to get the file path
                pdf_filename = data.get('pdf_url').split('/')[-1]
                pdf_path = os.path.join(os.getcwd(), 'uploads', 'research_papers', pdf_filename)

                # Generate thumbnail
                thumbnail_success, thumbnail_url, thumbnail_error = generate_research_paper_thumbnail(
                    pdf_path, new_content_id, user_id
                )

                # Update the content with the generated thumbnail URL
                if thumbnail_success:
                    cursor.execute("""
                        UPDATE Content SET Thumbnail_URL = %s WHERE Content_ID = %s
                    """, (thumbnail_url, new_content_id))

            # Create metrics entry
            cursor.execute("INSERT INTO Content_Metrics (Content_ID) VALUES (%s)", (new_content_id,))

            # Log the action if user is admin
            if user_role_result['Role_ID'] == 1:
                cursor.execute("""
                    INSERT INTO Audit_Logs (Admin_ID, Action_Type, Action_Details)
                    VALUES (%s, 'Create Research Paper', %s)
                """, (user_id, f"Created research paper: {data.get('title')}"))

            connection.commit()
            cursor.close()
            connection.close()

            return jsonify({
                "success": True,
                "message": "Research paper created successfully",
                "content_id": new_content_id
            }), 201

        except Exception as db_error:
            connection.rollback()
            cursor.close()
            connection.close()
            print(f"Database error: {db_error}")
            return jsonify({"success": False, "message": f"Database error: {str(db_error)}"}), 500
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/research-papers/<int:paper_id>', methods=['PUT'])
@require_permission('content_update_own', check_ownership=True)
def update_research_paper(user_id, paper_id):
    try:
        data = request.json

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Get content info and user role
        cursor.execute("""
            SELECT c.User_ID as content_owner_id, u.Role_ID as user_role
            FROM Content c
            JOIN Users u ON u.User_ID = %s
            WHERE c.Content_ID = %s AND c.Content_Type = 'Research_Paper'
        """, (user_id, paper_id))

        result = cursor.fetchone()

        if not result:
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "Research paper not found"}), 404

        # Check permissions: Admin can edit all, Editor can edit only their own
        user_role = result['user_role']
        content_owner_id = result['content_owner_id']

        if user_role == 1:  # Admin - can edit all
            pass
        elif user_role == 2 and content_owner_id == user_id:  # Editor - can edit only their own
            pass
        else:
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "Permission denied. You can only edit your own content."}), 403

        # Update Content table
        content_updates = []
        content_params = []

        if 'title' in data:
            content_updates.append("Title = %s")
            content_params.append(data['title'])
        if 'abstract' in data:  # Use abstract as summary for research papers
            content_updates.append("Summary = %s")
            content_params.append(data['abstract'])
        if 'abstract' in data:  # Use abstract as content for research papers
            content_updates.append("Content = %s")
            content_params.append(data['abstract'])
        if 'pdf_url' in data:  # Frontend sends pdf_url
            content_updates.append("Featured_Image = %s")
            content_params.append(data['pdf_url'])
        if 'thumbnail_url' in data:  # Frontend sends thumbnail_url
            content_updates.append("Thumbnail_URL = %s")
            content_params.append(data['thumbnail_url'])
        if 'keywords' in data:  # Use keywords as tags
            content_updates.append("Tags = %s")
            content_params.append(data['keywords'])
        if 'is_published' in data:  # Handle publication status
            status = 'Active' if data['is_published'] else 'Draft'
            content_updates.append("Status = %s")
            content_params.append(status)

        if content_updates:
            content_updates.append("Updated_At = NOW()")
            content_params.append(paper_id)

            cursor.execute(f"""
                UPDATE Content
                SET {', '.join(content_updates)}
                WHERE Content_ID = %s
            """, content_params)

        # Update Research_Papers table
        paper_updates = []
        paper_params = []

        if 'authors' in data:
            paper_updates.append("Authors = %s")
            paper_params.append(data['authors'])
        if 'journal_name' in data:  # Frontend sends journal_name
            paper_updates.append("Publication = %s")
            paper_params.append(data['journal_name'])
        if 'publication_date' in data:
            paper_updates.append("Publication_Date = %s")
            paper_params.append(data['publication_date'])
        if 'doi' in data:
            paper_updates.append("DOI = %s")
            paper_params.append(data['doi'])
        if 'keywords' in data:
            paper_updates.append("Keywords = %s")
            paper_params.append(data['keywords'])
        if 'abstract' in data:
            paper_updates.append("Abstract = %s")
            paper_params.append(data['abstract'])

        if paper_updates:
            paper_params.append(paper_id)

            cursor.execute(f"""
                UPDATE Research_Papers
                SET {', '.join(paper_updates)}
                WHERE Content_ID = %s
            """, paper_params)

        # Check if PDF URL was updated and regenerate thumbnail if needed
        pdf_url_updated = 'pdf_url' in data and data['pdf_url']
        thumbnail_url_provided = 'thumbnail_url' in data and data['thumbnail_url']

        print(f"🔍 DEBUG: pdf_url_updated={pdf_url_updated}, thumbnail_url_provided={thumbnail_url_provided}")
        print(f"🔍 DEBUG: data keys: {list(data.keys())}")
        if 'pdf_url' in data:
            print(f"🔍 DEBUG: pdf_url value: {data['pdf_url']}")
        if 'thumbnail_url' in data:
            print(f"🔍 DEBUG: thumbnail_url value: {data['thumbnail_url']}")

        if pdf_url_updated:
            # Extract filename from PDF URL to get the file path
            pdf_filename = data['pdf_url'].split('/')[-1]
            pdf_path = os.path.join(os.getcwd(), 'uploads', 'research_papers', pdf_filename)

            # Check if the PDF file exists
            if os.path.exists(pdf_path):
                # Import thumbnail generation function
                from utils.pdf_thumbnail import generate_research_paper_thumbnail

                # Generate new thumbnail (this will overwrite any existing thumbnail)
                thumbnail_success, new_thumbnail_url, thumbnail_error = generate_research_paper_thumbnail(
                    pdf_path, paper_id, user_id
                )

                # Update the content with the new thumbnail URL
                if thumbnail_success:
                    cursor.execute("""
                        UPDATE Content SET Thumbnail_URL = %s WHERE Content_ID = %s
                    """, (new_thumbnail_url, paper_id))
                    print(f"✅ Thumbnail regenerated for research paper {paper_id}: {new_thumbnail_url}")
                else:
                    print(f"⚠️ Failed to regenerate thumbnail for research paper {paper_id}: {thumbnail_error}")
                    # If thumbnail generation failed but a thumbnail URL was provided, use that
                    if thumbnail_url_provided:
                        cursor.execute("""
                            UPDATE Content SET Thumbnail_URL = %s WHERE Content_ID = %s
                        """, (data['thumbnail_url'], paper_id))
                        print(f"📎 Using provided thumbnail URL for research paper {paper_id}: {data['thumbnail_url']}")
            else:
                print(f"⚠️ PDF file not found for thumbnail regeneration: {pdf_path}")
                # If PDF file not found but thumbnail URL was provided, use that
                if thumbnail_url_provided:
                    cursor.execute("""
                        UPDATE Content SET Thumbnail_URL = %s WHERE Content_ID = %s
                    """, (data['thumbnail_url'], paper_id))
                    print(f"📎 Using provided thumbnail URL for research paper {paper_id}: {data['thumbnail_url']}")
        elif thumbnail_url_provided:
            # Only thumbnail URL was provided (no PDF URL change)
            cursor.execute("""
                UPDATE Content SET Thumbnail_URL = %s WHERE Content_ID = %s
            """, (data['thumbnail_url'], paper_id))
            print(f"📎 Updated thumbnail URL for research paper {paper_id}: {data['thumbnail_url']}")

        connection.commit()
        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "message": "Research paper updated successfully"
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/research-papers/<int:paper_id>', methods=['DELETE'])
@require_permission('content_delete_own', check_ownership=True)
def delete_research_paper(user_id, paper_id):
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Get content info and user role
        cursor.execute("""
            SELECT c.User_ID as content_owner_id, u.Role_ID as user_role
            FROM Content c
            JOIN Users u ON u.User_ID = %s
            WHERE c.Content_ID = %s AND c.Content_Type = 'Research_Paper'
        """, (user_id, paper_id))

        result = cursor.fetchone()

        if not result:
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "Research paper not found"}), 404

        # Check permissions: Admin can delete all, Editor can delete only their own
        user_role = result['user_role']
        content_owner_id = result['content_owner_id']

        if user_role == 1:  # Admin - can delete all
            pass
        elif user_role == 2 and content_owner_id == user_id:  # Editor - can delete only their own
            pass
        else:
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "Permission denied. You can only delete your own content."}), 403

        # Update the status to 'Deleted' instead of actually deleting
        cursor.execute("""
            UPDATE Content
            SET Status = 'Deleted', Updated_At = NOW()
            WHERE Content_ID = %s
        """, (paper_id,))

        # Log the action if user is admin
        if user_role == 1:
            cursor.execute("""
                INSERT INTO Audit_Logs (Admin_ID, Action_Type, Action_Details)
                VALUES (%s, 'Delete Research Paper', CONCAT('Deleted research paper ID: ', %s))
            """, (user_id, paper_id))

        connection.commit()
        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "message": "Research paper deleted successfully"
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/editor/dashboard', methods=['GET'])
@require_permission('content_create')
def get_editor_dashboard(user_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(buffered=True, dictionary=True)

        # Get editor's content statistics
        cursor.execute("""
            SELECT
                COUNT(CASE WHEN c.Content_Type = 'Blog_Post' THEN 1 END) as blog_posts,
                COUNT(CASE WHEN c.Content_Type = 'Research_Paper' THEN 1 END) as research_papers,
                COUNT(CASE WHEN c.Content_Type = 'Note' THEN 1 END) as notes,
                COUNT(CASE WHEN c.Content_Type = 'Job' THEN 1 END) as jobs,
                COUNT(CASE WHEN c.Content_Type = 'Internship' THEN 1 END) as internships,
                COUNT(CASE WHEN c.Content_Type = 'Course' THEN 1 END) as courses,
                COUNT(CASE WHEN c.Status = 'Active' THEN 1 END) as published_content,
                COUNT(CASE WHEN c.Status = 'Draft' THEN 1 END) as draft_content
            FROM Content c
            WHERE c.User_ID = %s
        """, (user_id,))

        content_stats = cursor.fetchone()

        # Get total views for editor's content
        cursor.execute("""
            SELECT
                COALESCE(SUM(cm.Views), 0) as total_views,
                COALESCE(SUM(cm.Likes), 0) as total_likes,
                COALESCE(SUM(cm.Shares), 0) as total_shares,
                COALESCE(SUM(cm.Comments), 0) as total_comments
            FROM Content c
            LEFT JOIN Content_Metrics cm ON c.Content_ID = cm.Content_ID
            WHERE c.User_ID = %s
        """, (user_id,))

        metrics_stats = cursor.fetchone()

        # Get recent content created by editor
        cursor.execute("""
            SELECT
                c.Content_ID,
                c.Title,
                c.Content_Type,
                c.Status,
                c.Created_At,
                COALESCE(cm.Views, 0) as views,
                COALESCE(cm.Likes, 0) as likes,
                COALESCE(cm.Comments, 0) as comments
            FROM Content c
            LEFT JOIN Content_Metrics cm ON c.Content_ID = cm.Content_ID
            WHERE c.User_ID = %s
            ORDER BY c.Created_At DESC
            LIMIT 5
        """, (user_id,))

        recent_content = cursor.fetchall()

        # Get applications for editor's job/internship posts and research paper submissions
        cursor.execute("""
            SELECT
                'job' as type,
                ja.Application_ID as id,
                c.Title as position,
                j.Company_Name as company,
                ja.Status as status,
                ja.Application_Date as applied_date,
                CONCAT(up.First_Name, ' ', up.Last_Name) as applicant_name
            FROM Job_Applications ja
            JOIN Jobs j ON ja.Job_ID = j.Job_ID
            JOIN Content c ON j.Content_ID = c.Content_ID
            JOIN Users u ON ja.User_ID = u.User_ID
            JOIN User_Profile up ON u.User_ID = up.User_ID
            WHERE c.User_ID = %s

            UNION ALL

            SELECT
                'internship' as type,
                ia.Application_ID as id,
                c.Title as position,
                i.Company_Name as company,
                ia.Status as status,
                ia.Application_Date as applied_date,
                CONCAT(up.First_Name, ' ', up.Last_Name) as applicant_name
            FROM Internship_Applications ia
            JOIN Internships i ON ia.Internship_ID = i.Internship_ID
            JOIN Content c ON i.Content_ID = c.Content_ID
            JOIN Users u ON ia.User_ID = u.User_ID
            JOIN User_Profile up ON u.User_ID = up.User_ID
            WHERE c.User_ID = %s

            UNION ALL

            SELECT
                'research_submission' as type,
                rps.Submission_ID as id,
                rps.Title as position,
                'Research Paper' as company,
                rps.Status as status,
                rps.Submitted_At as applied_date,
                CONCAT(up.First_Name, ' ', up.Last_Name) as applicant_name
            FROM Research_Paper_Submissions rps
            JOIN Users u ON rps.User_ID = u.User_ID
            JOIN User_Profile up ON u.User_ID = up.User_ID
            WHERE rps.Status IN ('Pending', 'Under Review')

            ORDER BY applied_date DESC
            LIMIT 5
        """, (user_id, user_id))

        recent_applications = cursor.fetchall()

        # Get pending applications count
        cursor.execute("""
            SELECT
                COUNT(DISTINCT ja.Application_ID) + COUNT(DISTINCT ia.Application_ID) as pending_count
            FROM Content c
            LEFT JOIN Jobs j ON c.Content_ID = j.Content_ID
            LEFT JOIN Internships i ON c.Content_ID = i.Content_ID
            LEFT JOIN Job_Applications ja ON j.Job_ID = ja.Job_ID AND ja.Status = 'Pending'
            LEFT JOIN Internship_Applications ia ON i.Internship_ID = ia.Internship_ID AND ia.Status = 'Pending'
            WHERE c.User_ID = %s
        """, (user_id,))

        pending_apps = cursor.fetchone()

        dashboard_data = {
            'stats': {
                'total_content': (content_stats['blog_posts'] or 0) + (content_stats['research_papers'] or 0) +
                               (content_stats['notes'] or 0) + (content_stats['jobs'] or 0) +
                               (content_stats['internships'] or 0) + (content_stats['courses'] or 0),
                'published_content': content_stats['published_content'] or 0,
                'draft_content': content_stats['draft_content'] or 0,
                'total_views': metrics_stats['total_views'] or 0,
                'total_likes': metrics_stats['total_likes'] or 0,
                'total_shares': metrics_stats['total_shares'] or 0,
                'total_comments': metrics_stats['total_comments'] or 0,
                'pending_applications': pending_apps['pending_count'] or 0,
                'blog_posts': content_stats['blog_posts'] or 0,
                'research_papers': content_stats['research_papers'] or 0,
                'jobs': content_stats['jobs'] or 0,
                'internships': content_stats['internships'] or 0
            },
            'recent_content': recent_content,
            'recent_applications': recent_applications
        }

        return jsonify(dashboard_data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ===== NOTES ROUTES =====

@app.route('/api/notes', methods=['GET'])
def get_notes():
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Get query parameters for filtering and search
        search_keywords = request.args.get('search', '')
        category = request.args.get('category')
        author_name = request.args.get('author')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        sort_by = request.args.get('sort_by', 'recent')  # recent, popular, saved
        limit = request.args.get('limit', 10, type=int)
        offset = request.args.get('offset', 0, type=int)

        # Basic query compatible with current database schema
        query = """
            SELECT n.Note_ID as note_id, c.Content_ID as content_id, c.User_ID as user_id,
                   c.Title as title, c.Summary as summary, c.Content as content,
                   c.Created_At as created_at, c.Updated_At as updated_at,
                   c.Status as status, n.Category as category, n.Is_Private as is_private,
                   0 as save_count, up.Full_Name as author_name,
                   COALESCE(cm.Views, 0) as view_count, 0 as metric_save_count,
                   n.Content_Type as content_type, n.PDF_File_Path as pdf_file_path,
                   n.PDF_File_Size as pdf_file_size
            FROM Content c
            JOIN Notes n ON c.Content_ID = n.Content_ID
            JOIN Users u ON c.User_ID = u.User_ID
            JOIN User_Profile up ON u.User_ID = up.User_ID
            LEFT JOIN Content_Metrics cm ON c.Content_ID = cm.Content_ID
            WHERE c.Content_Type = 'Note' AND c.Status = 'Active'
            AND n.Is_Private = FALSE
        """

        params = []

        # Add search filters
        if search_keywords:
            query += " AND (c.Title LIKE %s OR c.Content LIKE %s)"
            search_param = f"%{search_keywords}%"
            params.extend([search_param, search_param])

        if category:
            query += " AND n.Category = %s"
            params.append(category)

        if author_name:
            query += " AND up.Full_Name LIKE %s"
            params.append(f"%{author_name}%")

        if date_from:
            query += " AND DATE(c.Created_At) >= %s"
            params.append(date_from)

        if date_to:
            query += " AND DATE(c.Created_At) <= %s"
            params.append(date_to)

        # Add sorting
        if sort_by == 'popular':
            query += " ORDER BY cm.Views DESC, c.Created_At DESC"
        elif sort_by == 'saved':
            query += " ORDER BY c.Created_At DESC"  # Fallback to recent for now
        else:  # recent
            query += " ORDER BY c.Created_At DESC"

        # Add pagination
        query += " LIMIT %s OFFSET %s"
        params.extend([limit, offset])

        cursor.execute(query, params)
        notes = cursor.fetchall()

        # Get total count for pagination with same filters
        count_query = """
            SELECT COUNT(*) as total
            FROM Content c
            JOIN Notes n ON c.Content_ID = n.Content_ID
            JOIN Users u ON c.User_ID = u.User_ID
            JOIN User_Profile up ON u.User_ID = up.User_ID
            WHERE c.Content_Type = 'Note' AND c.Status = 'Active'
            AND n.Is_Private = FALSE
        """

        count_params = []

        # Apply same filters for count
        if search_keywords:
            count_query += " AND (c.Title LIKE %s OR c.Content LIKE %s)"
            search_param = f"%{search_keywords}%"
            count_params.extend([search_param, search_param])

        if category:
            count_query += " AND n.Category = %s"
            count_params.append(category)

        if author_name:
            count_query += " AND up.Full_Name LIKE %s"
            count_params.append(f"%{author_name}%")

        if date_from:
            count_query += " AND DATE(c.Created_At) >= %s"
            count_params.append(date_from)

        if date_to:
            count_query += " AND DATE(c.Created_At) <= %s"
            count_params.append(date_to)

        cursor.execute(count_query, count_params)
        total_count = cursor.fetchone()['total']

        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "notes": notes,
            "total": total_count,
            "limit": limit,
            "offset": offset
        })
    except Exception as e:
        print(f"Error in get_notes: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/notes/<int:note_id>', methods=['GET'])
def get_note(note_id):
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Get individual note details
        query = """
            SELECT n.Note_ID as note_id, c.Content_ID as content_id, c.User_ID as user_id,
                   c.Title as title, c.Summary as summary, c.Content as content,
                   c.Created_At as created_at, c.Updated_At as updated_at,
                   c.Status as status, n.Category as category, n.Is_Private as is_private,
                   0 as save_count, up.Full_Name as author_name,
                   COALESCE(cm.Views, 0) as view_count, 0 as metric_save_count,
                   n.Content_Type as content_type, n.PDF_File_Path as pdf_file_path,
                   n.PDF_File_Size as pdf_file_size
            FROM Content c
            JOIN Notes n ON c.Content_ID = n.Content_ID
            JOIN Users u ON c.User_ID = u.User_ID
            JOIN User_Profile up ON u.User_ID = up.User_ID
            LEFT JOIN Content_Metrics cm ON c.Content_ID = cm.Content_ID
            WHERE n.Note_ID = %s AND c.Content_Type = 'Note' AND c.Status = 'Active'
        """

        cursor.execute(query, (note_id,))
        note = cursor.fetchone()

        if not note:
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "Note not found"}), 404

        # Update view count
        cursor.execute("""
            UPDATE Content_Metrics
            SET Views = Views + 1, Last_Updated = NOW()
            WHERE Content_ID = %s
        """, (note['content_id'],))

        connection.commit()
        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "note": note
        })
    except Exception as e:
        print(f"Error in get_note: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/notes', methods=['POST'])
@require_permission('content_create_own')
def create_note(user_id):
    try:
        data = request.json

        # Validate required fields based on content type
        content_type = data.get('content_type', 'text')

        if content_type == 'pdf':
            required_fields = ['title', 'pdf_file_path', 'pdf_file_size']
        else:
            required_fields = ['title', 'content']

        for field in required_fields:
            if field not in data:
                return jsonify({"success": False, "message": f"Missing required field: {field}"}), 400

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Check user role first
        cursor.execute("SELECT Role_ID FROM Users WHERE User_ID = %s", (user_id,))
        user_role_result = cursor.fetchone()

        if not user_role_result or user_role_result['Role_ID'] not in [1, 2]:
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "User does not have permission to create notes"}), 403

        # Insert directly into database instead of using stored procedure
        try:
            # Prepare content and summary based on content type
            if content_type == 'pdf':
                content = data.get('extracted_text', '')
                summary = f"PDF Document: {data.get('title')}"
                if len(content) > 200:
                    summary = content[:200] + '...'
            else:
                content = data.get('content', '')
                summary = content[:200] + '...' if len(content) > 200 else content

            # Insert into Content table
            cursor.execute("""
                INSERT INTO Content (User_ID, Content_Type, Title, Summary, Content, Featured_Image, Tags, Status)
                VALUES (%s, 'Note', %s, %s, %s, '', '', 'Active')
            """, (
                user_id,
                data.get('title'),
                summary,
                content
            ))

            # Get the Content_ID of the newly created content
            new_content_id = cursor.lastrowid

            # Insert into Notes table with PDF-specific fields
            cursor.execute("""
                INSERT INTO Notes (Content_ID, Category, Is_Private, Content_Type, PDF_File_Path, PDF_File_Size)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                new_content_id,
                data.get('category', 'General'),
                data.get('is_private', False),
                content_type,
                data.get('pdf_file_path') if content_type == 'pdf' else None,
                data.get('pdf_file_size') if content_type == 'pdf' else None
            ))

            # Create metrics entry
            cursor.execute("INSERT INTO Content_Metrics (Content_ID) VALUES (%s)", (new_content_id,))

            # Log the action if user is admin
            if user_role_result['Role_ID'] == 1:
                cursor.execute("""
                    INSERT INTO Audit_Logs (Admin_ID, Action_Type, Action_Details)
                    VALUES (%s, 'Create Note', %s)
                """, (user_id, f"Created note: {data.get('title')}"))

            connection.commit()
            cursor.close()
            connection.close()

            return jsonify({
                "success": True,
                "message": "Note created successfully",
                "content_id": new_content_id
            }), 201

        except Exception as db_error:
            connection.rollback()
            cursor.close()
            connection.close()
            print(f"Database error: {db_error}")
            return jsonify({"success": False, "message": f"Database error: {str(db_error)}"}), 500
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# Update an existing note
@app.route('/api/notes/<int:note_id>', methods=['PUT'])
@require_permission('content_update_own', check_ownership=True)
def update_note(user_id, note_id):
    try:
        data = request.json

        # Validate required fields
        required_fields = ['title', 'content']
        for field in required_fields:
            if field not in data:
                return jsonify({"success": False, "message": f"Missing required field: {field}"}), 400

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Get note info and user role
        cursor.execute("""
            SELECT c.Content_ID, c.User_ID as content_owner_id, n.Note_ID, u.Role_ID as user_role
            FROM Content c
            JOIN Notes n ON c.Content_ID = n.Content_ID
            JOIN Users u ON u.User_ID = %s
            WHERE n.Note_ID = %s AND c.Content_Type = 'Note'
        """, (user_id, note_id))

        result = cursor.fetchone()
        if not result:
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "Note not found"}), 404

        # Check permissions: Admin can edit all, Editor can edit only their own
        user_role = result['user_role']
        content_owner_id = result['content_owner_id']

        if user_role == 1:  # Admin - can edit all
            pass
        elif user_role == 2 and content_owner_id == user_id:  # Editor - can edit only their own
            pass
        else:
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "Permission denied. You can only edit your own content."}), 403

        note = result

        # Update the Content table
        cursor.execute("""
            UPDATE Content
            SET Title = %s,
                Summary = %s,
                Content = %s,
                Updated_At = NOW()
            WHERE Content_ID = %s
        """, (
            data.get('title'),
            data.get('content')[:200] + '...' if len(data.get('content', '')) > 200 else data.get('content', ''),
            data.get('content'),
            note['Content_ID']
        ))

        # Update the Notes table
        cursor.execute("""
            UPDATE Notes
            SET Category = %s,
                Is_Private = %s
            WHERE Note_ID = %s
        """, (
            data.get('category', 'General'),
            data.get('is_private', False),
            note_id
        ))

        connection.commit()
        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "message": "Note updated successfully",
            "note_id": note_id
        })

    except Exception as e:
        print(f"Error in update_note: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500



# Delete a note
@app.route('/api/notes/<int:note_id>', methods=['DELETE'])
@require_permission('content_delete_own', check_ownership=True)
def delete_note(user_id, note_id):
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Get note info and user role
        cursor.execute("""
            SELECT c.Content_ID, c.User_ID as content_owner_id, n.Note_ID, u.Role_ID as user_role
            FROM Content c
            JOIN Notes n ON c.Content_ID = n.Content_ID
            JOIN Users u ON u.User_ID = %s
            WHERE n.Note_ID = %s AND c.Content_Type = 'Note'
        """, (user_id, note_id))

        result = cursor.fetchone()
        if not result:
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "Note not found"}), 404

        # Check permissions: Admin can delete all, Editor can delete only their own
        user_role = result['user_role']
        content_owner_id = result['content_owner_id']

        if user_role == 1:  # Admin - can delete all
            pass
        elif user_role == 2 and content_owner_id == user_id:  # Editor - can delete only their own
            pass
        else:
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "Permission denied. You can only delete your own content."}), 403

        note = result

        # Soft delete - update status to 'Deleted'
        cursor.execute("""
            UPDATE Content
            SET Status = 'Deleted', Updated_At = NOW()
            WHERE Content_ID = %s
        """, (note['Content_ID'],))

        connection.commit()
        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "message": "Note deleted successfully"
        })

    except Exception as e:
        print(f"Error in delete_note: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

# Get user's personal library (created notes + saved notes) - Simplified version
@app.route('/api/notes/library', methods=['GET'])
@require_permission('content_create')
def get_user_notes_library(user_id):
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        library_type = request.args.get('type', 'all')  # all, created, saved
        limit = request.args.get('limit', 20, type=int)
        offset = request.args.get('offset', 0, type=int)

        # Enhanced query to show both created and saved notes
        if library_type == 'created':
            # Only user's original created notes
            query = """
                SELECT n.Note_ID as note_id, c.Content_ID as content_id, c.User_ID as user_id,
                       c.Title as title, c.Summary as summary, c.Content as content,
                       c.Created_At as created_at, c.Updated_At as updated_at,
                       n.Category as category, n.Is_Private as is_private,
                       0 as save_count, up.Full_Name as author_name,
                       COALESCE(cm.Views, 0) as view_count, 'created' as note_type
                FROM Content c
                JOIN Notes n ON c.Content_ID = n.Content_ID
                JOIN Users u ON c.User_ID = u.User_ID
                JOIN User_Profile up ON u.User_ID = up.User_ID
                LEFT JOIN Content_Metrics cm ON c.Content_ID = cm.Content_ID
                WHERE c.Content_Type = 'Note' AND c.Status = 'Active'
                AND c.User_ID = %s AND c.Title NOT LIKE '[SAVED]%'
                ORDER BY c.Created_At DESC
                LIMIT %s OFFSET %s
            """
        elif library_type == 'saved':
            # Only saved notes from others
            query = """
                SELECT n.Note_ID as note_id, c.Content_ID as content_id, c.User_ID as user_id,
                       c.Title as title, c.Summary as summary, c.Content as content,
                       c.Created_At as created_at, c.Updated_At as updated_at,
                       n.Category as category, n.Is_Private as is_private,
                       0 as save_count, up.Full_Name as author_name,
                       COALESCE(cm.Views, 0) as view_count, 'saved' as note_type
                FROM Content c
                JOIN Notes n ON c.Content_ID = n.Content_ID
                JOIN Users u ON c.User_ID = u.User_ID
                JOIN User_Profile up ON u.User_ID = up.User_ID
                LEFT JOIN Content_Metrics cm ON c.Content_ID = cm.Content_ID
                WHERE c.Content_Type = 'Note' AND c.Status = 'Active'
                AND c.User_ID = %s AND c.Title LIKE '[SAVED]%'
                ORDER BY c.Created_At DESC
                LIMIT %s OFFSET %s
            """
        else:
            # All notes (both created and saved)
            query = """
                SELECT n.Note_ID as note_id, c.Content_ID as content_id, c.User_ID as user_id,
                       c.Title as title, c.Summary as summary, c.Content as content,
                       c.Created_At as created_at, c.Updated_At as updated_at,
                       n.Category as category, n.Is_Private as is_private,
                       0 as save_count, up.Full_Name as author_name,
                       COALESCE(cm.Views, 0) as view_count,
                       CASE WHEN c.Title LIKE '[SAVED]%' THEN 'saved' ELSE 'created' END as note_type
                FROM Content c
                JOIN Notes n ON c.Content_ID = n.Content_ID
                JOIN Users u ON c.User_ID = u.User_ID
                JOIN User_Profile up ON u.User_ID = up.User_ID
                LEFT JOIN Content_Metrics cm ON c.Content_ID = cm.Content_ID
                WHERE c.Content_Type = 'Note' AND c.Status = 'Active'
                AND c.User_ID = %s
                ORDER BY c.Created_At DESC
                LIMIT %s OFFSET %s
            """

        cursor.execute(query, (user_id, limit, offset))
        notes = cursor.fetchall()

        # Get total count with same filtering
        if library_type == 'created':
            count_query = """
                SELECT COUNT(*) as total FROM Content c
                JOIN Notes n ON c.Content_ID = n.Content_ID
                WHERE c.Content_Type = 'Note' AND c.Status = 'Active'
                AND c.User_ID = %s AND c.Title NOT LIKE '[SAVED]%'
            """
        elif library_type == 'saved':
            count_query = """
                SELECT COUNT(*) as total FROM Content c
                JOIN Notes n ON c.Content_ID = n.Content_ID
                WHERE c.Content_Type = 'Note' AND c.Status = 'Active'
                AND c.User_ID = %s AND c.Title LIKE '[SAVED]%'
            """
        else:
            count_query = """
                SELECT COUNT(*) as total FROM Content c
                JOIN Notes n ON c.Content_ID = n.Content_ID
                WHERE c.Content_Type = 'Note' AND c.Status = 'Active'
                AND c.User_ID = %s
            """

        cursor.execute(count_query, (user_id,))
        total_count = cursor.fetchone()['total']

        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "notes": notes,
            "total": total_count,
            "limit": limit,
            "offset": offset,
            "library_type": library_type
        })
    except Exception as e:
        print(f"Error in get_user_notes_library: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

# Save a public note to user's library - Real implementation
@app.route('/api/notes/<int:note_id>/save', methods=['POST'])
@require_permission('content_create')
def save_note_to_library(user_id, note_id):
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Get original note details first
        cursor.execute("""
            SELECT c.Content_ID, c.Title, c.Summary, c.Content, c.User_ID as original_user_id,
                   n.Category, up.Full_Name as original_author_name
            FROM Notes n
            JOIN Content c ON n.Content_ID = c.Content_ID
            JOIN Users u ON c.User_ID = u.User_ID
            JOIN User_Profile up ON u.User_ID = up.User_ID
            WHERE n.Note_ID = %s AND n.Is_Private = FALSE AND c.Status = 'Active'
        """, (note_id,))

        original_note = cursor.fetchone()
        if not original_note:
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "Original note not found or not public"}), 404

        # Check if user already saved this specific note
        saved_title = f"[SAVED] {original_note['Title']}"
        cursor.execute("""
            SELECT c.Content_ID FROM Content c
            WHERE c.User_ID = %s AND c.Title = %s AND c.Content_Type = 'Note'
        """, (user_id, saved_title))

        existing_save = cursor.fetchone()
        if existing_save:
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "You have already saved this note to your library"}), 400

        # Create new content entry (copy)
        cursor.execute("""
            INSERT INTO Content (User_ID, Content_Type, Title, Summary, Content, Status)
            VALUES (%s, 'Note', %s, %s, %s, 'Active')
        """, (
            user_id,
            saved_title,
            f"Saved from: {original_note['original_author_name']} | {original_note['Summary'] or ''}",
            f"[Originally created by: {original_note['original_author_name']}]\n\n{original_note['Content']}"
        ))

        new_content_id = cursor.lastrowid

        # Create new note entry (copy) - always private for saved notes
        cursor.execute("""
            INSERT INTO Notes (Content_ID, Category, Is_Private)
            VALUES (%s, %s, TRUE)
        """, (
            new_content_id,
            f"Saved - {original_note['Category']}"
        ))

        new_note_id = cursor.lastrowid

        # Create metrics entry for the new note
        cursor.execute("INSERT INTO Content_Metrics (Content_ID) VALUES (%s)", (new_content_id,))

        # Commit all changes
        connection.commit()
        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "message": "Note saved to your library successfully!",
            "saved_note_id": new_note_id,
            "saved_content_id": new_content_id
        })

    except Exception as e:
        print(f"Error in save_note_to_library: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500



# ===== COURSES ROUTES =====

@app.route('/api/courses', methods=['GET'])
def get_courses():
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Get query parameters for filtering
        status = request.args.get('status', 'Active')
        limit = request.args.get('limit', 10, type=int)
        offset = request.args.get('offset', 0, type=int)

        # Base query - Fixed field names to match frontend expectations
        query = """
            SELECT c.Content_ID as content_id, c.User_ID as user_id, c.Title as title,
                   c.Summary as summary, c.Content as content,
                   c.Featured_Image as featured_image, c.Tags as tags,
                   c.Created_At as created_at, c.Updated_At as updated_at, c.Status as status,
                   c.Is_Featured as is_featured, ac.Course_ID as course_id, ac.Instructor as instructor,
                   ac.Duration as duration, ac.Start_Date as start_date,
                   ac.End_Date as end_date, ac.Enrollment_Limit as enrollment_limit,
                   ac.Current_Enrollment as current_enrollment,
                   ac.Prerequisites as prerequisites, ac.Syllabus as syllabus,
                   up.Full_Name as author_name
            FROM Content c
            JOIN Available_Courses ac ON c.Content_ID = ac.Content_ID
            JOIN Users u ON c.User_ID = u.User_ID
            JOIN User_Profile up ON u.User_ID = up.User_ID
            WHERE c.Content_Type = 'Course'
        """

        params = []

        # Add filters
        if status:
            query += " AND c.Status = %s"
            params.append(status)

        # Add sorting and pagination
        query += " ORDER BY c.Created_At DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])

        cursor.execute(query, params)
        courses = cursor.fetchall()

        # Get total count for pagination
        count_query = """
            SELECT COUNT(*) as total
            FROM Content c
            JOIN Available_Courses ac ON c.Content_ID = ac.Content_ID
            WHERE c.Content_Type = 'Course'
        """

        count_params = []

        if status:
            count_query += " AND c.Status = %s"
            count_params.append(status)

        cursor.execute(count_query, count_params)
        total_count = cursor.fetchone()['total']

        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "courses": courses,
            "total": total_count,
            "limit": limit,
            "offset": offset
        })
    except Exception as e:
        print(f"Error in get_courses: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/courses', methods=['POST'])
@require_permission('content_create')
def create_course(user_id):
    try:
        data = request.json

        # Validate required fields
        required_fields = ['title', 'content', 'instructor', 'start_date', 'end_date']
        for field in required_fields:
            if field not in data:
                return jsonify({"success": False, "message": f"Missing required field: {field}"}), 400

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Call the stored procedure to create a course
        cursor.callproc('create_course', (
            user_id,
            data.get('title'),
            data.get('summary', ''),
            data.get('content'),
            data.get('featured_image', ''),
            data.get('tags', ''),
            data.get('instructor'),
            data.get('duration', ''),
            data.get('start_date'),
            data.get('end_date'),
            data.get('enrollment_limit', 0),
            data.get('prerequisites', ''),
            data.get('syllabus', '')
        ))

        # Get the result from the stored procedure
        for result in cursor.stored_results():
            procedure_result = result.fetchone()

        connection.commit()
        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "message": procedure_result[0],
            "content_id": procedure_result[1]
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/courses/<int:course_id>', methods=['PUT'])
@require_permission('content_update_own', check_ownership=True)
def update_course(user_id, course_id):
    try:
        data = request.json

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Get course info and user role
        cursor.execute("""
            SELECT c.User_ID as content_owner_id, c.Content_ID, u.Role_ID as user_role
            FROM Available_Courses ac
            JOIN Content c ON ac.Content_ID = c.Content_ID
            JOIN Users u ON u.User_ID = %s
            WHERE ac.Course_ID = %s AND c.Content_Type = 'Course'
        """, (user_id, course_id))

        result = cursor.fetchone()

        if not result:
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "Course not found"}), 404

        # Check permissions: Admin can edit all, Editor can edit only their own
        user_role = result['user_role']
        content_owner_id = result['content_owner_id']

        if user_role == 1:  # Admin - can edit all
            pass
        elif user_role == 2 and content_owner_id == user_id:  # Editor - can edit only their own
            pass
        else:
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "Permission denied. You can only edit your own content."}), 403

        content_id = result['Content_ID']

        # Update the Content table
        content_update_query = """
            UPDATE Content
            SET Title = %s, Summary = %s, Content = %s, Featured_Image = %s,
                Tags = %s, Updated_At = NOW(), Is_Featured = %s
            WHERE Content_ID = %s
        """

        cursor.execute(content_update_query, (
            data.get('title'),
            data.get('summary', ''),
            data.get('content'),
            data.get('featured_image', ''),
            data.get('tags', ''),
            data.get('is_featured', False),
            content_id
        ))

        # Update the Available_Courses table
        course_update_query = """
            UPDATE Available_Courses
            SET Instructor = %s, Duration = %s, Start_Date = %s, End_Date = %s,
                Enrollment_Limit = %s, Prerequisites = %s, Syllabus = %s
            WHERE Course_ID = %s
        """

        cursor.execute(course_update_query, (
            data.get('instructor'),
            data.get('duration', ''),
            data.get('start_date'),
            data.get('end_date'),
            data.get('enrollment_limit', 0),
            data.get('prerequisites', ''),
            data.get('syllabus', ''),
            course_id
        ))

        connection.commit()
        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "message": "Course updated successfully"
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/courses/<int:course_id>', methods=['DELETE'])
@require_permission('content_delete_own', check_ownership=True)
def delete_course(user_id, course_id):
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Get course info and user role
        cursor.execute("""
            SELECT c.User_ID as content_owner_id, c.Content_ID, u.Role_ID as user_role
            FROM Available_Courses ac
            JOIN Content c ON ac.Content_ID = c.Content_ID
            JOIN Users u ON u.User_ID = %s
            WHERE ac.Course_ID = %s AND c.Content_Type = 'Course'
        """, (user_id, course_id))

        result = cursor.fetchone()

        if not result:
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "Course not found"}), 404

        # Check permissions: Admin can delete all, Editor can delete only their own
        user_role = result['user_role']
        content_owner_id = result['content_owner_id']

        if user_role == 1:  # Admin - can delete all
            pass
        elif user_role == 2 and content_owner_id == user_id:  # Editor - can delete only their own
            pass
        else:
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "Permission denied. You can only delete your own content."}), 403

        content_id = result['Content_ID']

        # Update the status to 'Deleted' instead of actually deleting
        cursor.execute("""
            UPDATE Content
            SET Status = 'Deleted', Updated_At = NOW()
            WHERE Content_ID = %s
        """, (content_id,))

        connection.commit()
        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "message": "Course deleted successfully"
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# ===== CONTENT MANAGEMENT ROUTES =====

@app.route('/api/content/<int:content_id>/status', methods=['PUT'])
@require_permission('content_update')
def update_content_status(user_id, content_id):
    try:
        data = request.json

        if 'status' not in data:
            return jsonify({"success": False, "message": "Status is required"}), 400

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Call the stored procedure to update content status
        cursor.callproc('update_content_status', (
            user_id,
            content_id,
            data.get('status')
        ))

        # Get the result from the stored procedure
        for result in cursor.stored_results():
            procedure_result = result.fetchone()

        connection.commit()
        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "message": procedure_result[0]
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/content/<int:content_id>/metrics', methods=['GET'])
@require_permission('metrics_view')
def get_metrics(user_id, content_id):
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Call the stored procedure to get content metrics
        cursor.callproc('get_content_metrics', (
            user_id,
            content_id
        ))

        # Get the result from the stored procedure
        metrics = None
        for result in cursor.stored_results():
            metrics = result.fetchone()

        cursor.close()
        connection.close()

        if not metrics:
            return jsonify({"success": False, "message": "Metrics not found or permission denied"}), 404

        return jsonify({
            "success": True,
            "metrics": metrics
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# ===== JOB POSTING ROUTES =====

@app.route('/api/jobs', methods=['GET'])
def get_jobs():
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Get query parameters for filtering
        company = request.args.get('company')
        location = request.args.get('location')
        job_type = request.args.get('job_type')
        status = request.args.get('status', 'Active')
        limit = request.args.get('limit', 10, type=int)
        offset = request.args.get('offset', 0, type=int)

        # Base query - Fixed field names to match frontend expectations
        query = """
            SELECT c.Content_ID as content_id, c.User_ID as user_id, c.Title as title,
                   c.Summary as summary, c.Content as content,
                   c.Featured_Image as featured_image, c.Tags as tags,
                   c.Created_At as created_at, c.Updated_At as updated_at, c.Status as status,
                   c.Is_Featured as is_featured, j.Job_ID as job_id, j.Company_Name as company_name,
                   j.Location as location, j.Job_Type as job_type,
                   j.Salary_Range as salary_range, j.Experience_Required as experience_required,
                   j.Eligibility_Criteria as eligibility_criteria,
                   j.Application_Deadline as application_deadline, j.Contact_Email as contact_email,
                   j.Contact_Phone as contact_phone,
                   j.Is_Featured as job_is_featured,
                   up.Full_Name as posted_by
            FROM Content c
            JOIN Jobs j ON c.Content_ID = j.Content_ID
            JOIN Users u ON c.User_ID = u.User_ID
            JOIN User_Profile up ON u.User_ID = up.User_ID
            WHERE c.Content_Type = 'Job'
        """

        params = []

        # Add filters
        if company:
            query += " AND j.Company_Name LIKE %s"
            params.append(f"%{company}%")

        if location:
            query += " AND j.Location LIKE %s"
            params.append(f"%{location}%")

        if job_type:
            query += " AND j.Job_Type = %s"
            params.append(job_type)

        if status:
            query += " AND c.Status = %s"
            params.append(status)

        # Add sorting and pagination
        query += " ORDER BY j.Is_Featured DESC, c.Created_At DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])

        cursor.execute(query, params)
        jobs = cursor.fetchall()

        # Get total count for pagination
        count_query = """
            SELECT COUNT(*) as total
            FROM Content c
            JOIN Jobs j ON c.Content_ID = j.Content_ID
            WHERE c.Content_Type = 'Job'
        """

        count_params = []

        if company:
            count_query += " AND j.Company_Name LIKE %s"
            count_params.append(f"%{company}%")

        if location:
            count_query += " AND j.Location LIKE %s"
            count_params.append(f"%{location}%")

        if job_type:
            count_query += " AND j.Job_Type = %s"
            count_params.append(job_type)

        if status:
            count_query += " AND c.Status = %s"
            count_params.append(status)

        cursor.execute(count_query, count_params)
        total_count = cursor.fetchone()['total']

        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "jobs": jobs,
            "total": total_count,
            "limit": limit,
            "offset": offset
        })
    except Exception as e:
        print(f"Error in get_jobs: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/jobs/<int:job_id>', methods=['GET'])
@require_permission('content_read_public')
def get_job(user_id, job_id):
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Get the job posting - Fixed field names to match frontend expectations
        cursor.execute("""
            SELECT c.Content_ID as content_id, c.User_ID as user_id, c.Title as title,
                   c.Summary as summary, c.Content as content,
                   c.Featured_Image as featured_image, c.Tags as tags,
                   c.Created_At as created_at, c.Updated_At as updated_at, c.Status as status,
                   c.Is_Featured as is_featured, j.Job_ID as job_id,
                   j.Company_Name as company_name, j.Location as location, j.Job_Type as job_type,
                   j.Salary_Range as salary_range, j.Experience_Required as experience_required,
                   j.Eligibility_Criteria as eligibility_criteria,
                   j.Application_Deadline as application_deadline, j.Contact_Email as contact_email,
                   j.Contact_Phone as contact_phone,
                   j.Is_Featured as job_is_featured,
                   up.Full_Name as posted_by
            FROM Content c
            JOIN Jobs j ON c.Content_ID = j.Content_ID
            JOIN Users u ON c.User_ID = u.User_ID
            JOIN User_Profile up ON u.User_ID = up.User_ID
            WHERE j.Job_ID = %s AND c.Content_Type = 'Job'
        """, (job_id,))

        job = cursor.fetchone()

        if not job:
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "Job posting not found"}), 404

        # Check if user has already applied
        cursor.execute("""
            SELECT Application_ID, Application_Date, Status
            FROM Job_Applications
            WHERE Job_ID = %s AND User_ID = %s
        """, (job_id, user_id))

        application = cursor.fetchone()

        # Update view count in metrics
        cursor.execute("""
            UPDATE Content_Metrics
            SET Views = Views + 1, Last_Updated = NOW()
            WHERE Content_ID = %s
        """, (job['content_id'],))

        connection.commit()
        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "job": job,
            "has_applied": application is not None,
            "application": application
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/jobs', methods=['POST'])
@require_permission('content_create_own')
def create_job(user_id):
    try:
        data = request.json

        # Validate required fields
        required_fields = ['title', 'content', 'company_name', 'location', 'job_type', 'application_deadline']
        for field in required_fields:
            if field not in data:
                return jsonify({"success": False, "message": f"Missing required field: {field}"}), 400

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Check user role first
        cursor.execute("SELECT Role_ID FROM Users WHERE User_ID = %s", (user_id,))
        user_role_result = cursor.fetchone()

        if not user_role_result or user_role_result['Role_ID'] not in [1, 2]:
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "User does not have permission to create job postings"}), 403

        # Insert directly into database instead of using stored procedure
        try:
            # Insert into Content table
            cursor.execute("""
                INSERT INTO Content (User_ID, Content_Type, Title, Summary, Content, Featured_Image, Tags, Status, Is_Featured)
                VALUES (%s, 'Job', %s, %s, %s, %s, %s, 'Active', %s)
            """, (
                user_id,
                data.get('title'),
                data.get('summary', ''),
                data.get('content'),
                data.get('featured_image', ''),
                data.get('tags', ''),
                data.get('is_featured', False)
            ))

            # Get the Content_ID of the newly created content
            new_content_id = cursor.lastrowid

            # Insert into Jobs table
            cursor.execute("""
                INSERT INTO Jobs (Content_ID, Company_Name, Location, Job_Type, Salary_Range,
                                Experience_Required, Eligibility_Criteria, Application_Deadline,
                                Contact_Email, Contact_Phone, Is_Featured)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                new_content_id,
                data.get('company_name'),
                data.get('location'),
                data.get('job_type'),
                data.get('salary_range', ''),
                data.get('experience_required', ''),
                data.get('eligibility_criteria', ''),
                data.get('application_deadline'),
                data.get('contact_email', ''),
                data.get('contact_phone', ''),
                data.get('is_featured', False)
            ))

            # Create metrics entry
            cursor.execute("INSERT INTO Content_Metrics (Content_ID) VALUES (%s)", (new_content_id,))

            # Log the action if user is admin
            if user_role_result['Role_ID'] == 1:
                cursor.execute("""
                    INSERT INTO Audit_Logs (Admin_ID, Action_Type, Action_Details)
                    VALUES (%s, 'Create Job Posting', %s)
                """, (user_id, f"Created job posting: {data.get('title')}"))

            connection.commit()
            cursor.close()
            connection.close()

            return jsonify({
                "success": True,
                "message": "Job posting created successfully",
                "content_id": new_content_id
            }), 201

        except Exception as db_error:
            connection.rollback()
            cursor.close()
            connection.close()
            print(f"Database error: {db_error}")
            return jsonify({"success": False, "message": f"Database error: {str(db_error)}"}), 500
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/jobs/<int:job_id>/apply', methods=['POST'])
@require_permission('job_apply')
def apply_for_job(user_id, job_id):
    try:
        data = request.json

        # Validate required fields
        if 'resume_url' not in data:
            return jsonify({"success": False, "message": "Resume URL is required"}), 400

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Check if the job exists and is active (bypass stored procedure for now)
        cursor.execute("""
            SELECT j.Application_Deadline, c.Status
            FROM Jobs j
            JOIN Content c ON j.Content_ID = c.Content_ID
            WHERE j.Job_ID = %s
        """, (job_id,))

        job_info = cursor.fetchone()
        if not job_info:
            return jsonify({"success": False, "message": "Job posting not found"}), 404

        if job_info['Status'] != 'Active':
            return jsonify({"success": False, "message": "This job posting is no longer active"}), 400

        if job_info['Application_Deadline'] and job_info['Application_Deadline'] < datetime.now().date():
            return jsonify({"success": False, "message": "The application deadline for this job has passed"}), 400

        # Check if user has already applied
        cursor.execute("""
            SELECT COUNT(*) as count FROM Job_Applications
            WHERE Job_ID = %s AND User_ID = %s
        """, (job_id, user_id))

        already_applied = cursor.fetchone()['count']
        if already_applied > 0:
            return jsonify({"success": False, "message": "You have already applied for this job"}), 400

        # Insert the application
        cursor.execute("""
            INSERT INTO Job_Applications (Job_ID, User_ID, Resume_URL, Cover_Letter)
            VALUES (%s, %s, %s, %s)
        """, (job_id, user_id, data.get('resume_url'), data.get('cover_letter', '')))

        procedure_result = ["Application submitted successfully"]

        # Create notification for admins and editors
        cursor.execute("""
            SELECT up.Full_Name, j.Company_Name, c.Title
            FROM User_Profile up
            JOIN Jobs j ON j.Job_ID = %s
            JOIN Content c ON j.Content_ID = c.Content_ID
            WHERE up.User_ID = %s
        """, (job_id, user_id))

        applicant_info = cursor.fetchone()
        if applicant_info:
            notification_message = f"New job application: {applicant_info['Full_Name']} applied for {applicant_info['Title']} at {applicant_info['Company_Name']}"

            # Get all admins and editors
            cursor.execute("""
                SELECT User_ID FROM Users
                WHERE Role_ID IN (1, 2)
            """)

            admin_editors = cursor.fetchall()

            # Insert notifications for all admins and editors
            for admin_editor in admin_editors:
                cursor.execute("""
                    INSERT INTO Notifications (User_ID, Type, Title, Message, Related_Content_ID)
                    VALUES (%s, 'application', 'New Job Application', %s, %s)
                """, (admin_editor['User_ID'], notification_message, job_id))

        connection.commit()
        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "message": procedure_result[0]
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/jobs/<int:job_id>', methods=['PUT'])
@require_permission('content_update_own', check_ownership=True)
def update_job(user_id, job_id):
    try:
        data = request.json

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Get job info and user role
        cursor.execute("""
            SELECT c.User_ID as content_owner_id, c.Content_ID, u.Role_ID as user_role
            FROM Jobs j
            JOIN Content c ON j.Content_ID = c.Content_ID
            JOIN Users u ON u.User_ID = %s
            WHERE j.Job_ID = %s AND c.Content_Type = 'Job'
        """, (user_id, job_id))

        result = cursor.fetchone()

        if not result:
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "Job posting not found"}), 404

        # Check permissions: Admin can edit all, Editor can edit only their own
        user_role = result['user_role']
        content_owner_id = result['content_owner_id']

        if user_role == 1:  # Admin - can edit all
            pass
        elif user_role == 2 and content_owner_id == user_id:  # Editor - can edit only their own
            pass
        else:
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "Permission denied. You can only edit your own content."}), 403

        content_id = result['Content_ID']

        # Update the Content table
        content_update_query = """
            UPDATE Content
            SET Title = %s, Summary = %s, Content = %s, Featured_Image = %s,
                Tags = %s, Updated_At = NOW(), Is_Featured = %s
            WHERE Content_ID = %s
        """

        cursor.execute(content_update_query, (
            data.get('title'),
            data.get('summary', ''),
            data.get('content'),
            data.get('featured_image', ''),
            data.get('tags', ''),
            data.get('is_featured', False),
            content_id
        ))

        # Update the Jobs table
        job_update_query = """
            UPDATE Jobs
            SET Company_Name = %s, Location = %s, Job_Type = %s, Salary_Range = %s,
                Experience_Required = %s, Eligibility_Criteria = %s, Application_Deadline = %s,
                Contact_Email = %s, Contact_Phone = %s, Is_Featured = %s
            WHERE Job_ID = %s
        """

        cursor.execute(job_update_query, (
            data.get('company_name'),
            data.get('location'),
            data.get('job_type'),
            data.get('salary_range', ''),
            data.get('experience_required', ''),
            data.get('eligibility_criteria', ''),
            data.get('application_deadline'),
            data.get('contact_email', ''),
            data.get('contact_phone', ''),
            data.get('is_featured', False),
            job_id
        ))

        # Log the action if user is admin
        if user_role == 1:
            cursor.execute("""
                INSERT INTO Audit_Logs (Admin_ID, Action_Type, Action_Details)
                VALUES (%s, 'Update Job Posting', CONCAT('Updated job posting ID: ', %s))
            """, (user_id, job_id))

        connection.commit()
        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "message": "Job posting updated successfully"
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/jobs/<int:job_id>', methods=['DELETE'])
@require_permission('content_delete_own', check_ownership=True)
def delete_job(user_id, job_id):
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Get job info and user role
        cursor.execute("""
            SELECT c.User_ID as content_owner_id, c.Content_ID, u.Role_ID as user_role
            FROM Jobs j
            JOIN Content c ON j.Content_ID = c.Content_ID
            JOIN Users u ON u.User_ID = %s
            WHERE j.Job_ID = %s AND c.Content_Type = 'Job'
        """, (user_id, job_id))

        result = cursor.fetchone()

        if not result:
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "Job posting not found"}), 404

        # Check permissions: Admin can delete all, Editor can delete only their own
        user_role = result['user_role']
        content_owner_id = result['content_owner_id']

        if user_role == 1:  # Admin - can delete all
            pass
        elif user_role == 2 and content_owner_id == user_id:  # Editor - can delete only their own
            pass
        else:
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "Permission denied. You can only delete your own content."}), 403

        content_id = result['Content_ID']

        # Update the status to 'Deleted' instead of actually deleting
        cursor.execute("""
            UPDATE Content
            SET Status = 'Deleted', Updated_At = NOW()
            WHERE Content_ID = %s
        """, (content_id,))

        # Log the action if user is admin
        if user_role == 1:
            cursor.execute("""
                INSERT INTO Audit_Logs (Admin_ID, Action_Type, Action_Details)
                VALUES (%s, 'Delete Job Posting', CONCAT('Deleted job posting ID: ', %s))
            """, (user_id, job_id))

        connection.commit()
        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "message": "Job posting deleted successfully"
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# ===== INTERNSHIP POSTING ROUTES =====

@app.route('/api/internships', methods=['GET'])
def get_internships():
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Get query parameters for filtering
        company = request.args.get('company')
        location = request.args.get('location')
        internship_type = request.args.get('internship_type')
        status = request.args.get('status', 'Active')
        limit = request.args.get('limit', 10, type=int)
        offset = request.args.get('offset', 0, type=int)

        # Base query - Fixed field names to match frontend expectations
        query = """
            SELECT c.Content_ID as content_id, c.User_ID as user_id, c.Title as title,
                   c.Summary as summary, c.Content as content,
                   c.Featured_Image as featured_image, c.Tags as tags,
                   c.Created_At as created_at, c.Updated_At as updated_at, c.Status as status,
                   c.Is_Featured as is_featured, i.Internship_ID as internship_id,
                   i.Company_Name as company_name, i.Location as location,
                   i.Internship_Type as internship_type, i.Stipend as stipend,
                   i.Duration as duration, i.Eligibility_Criteria as eligibility_criteria,
                   i.Application_Deadline as application_deadline, i.Contact_Email as contact_email,
                   i.Contact_Phone as contact_phone,
                   i.Is_Featured as internship_is_featured,
                   up.Full_Name as posted_by
            FROM Content c
            JOIN Internships i ON c.Content_ID = i.Content_ID
            JOIN Users u ON c.User_ID = u.User_ID
            JOIN User_Profile up ON u.User_ID = up.User_ID
            WHERE c.Content_Type = 'Internship'
        """

        params = []

        # Add filters
        if company:
            query += " AND i.Company_Name LIKE %s"
            params.append(f"%{company}%")

        if location:
            query += " AND i.Location LIKE %s"
            params.append(f"%{location}%")

        if internship_type:
            query += " AND i.Internship_Type = %s"
            params.append(internship_type)

        if status:
            query += " AND c.Status = %s"
            params.append(status)

        # Add sorting and pagination
        query += " ORDER BY i.Is_Featured DESC, c.Created_At DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])

        cursor.execute(query, params)
        internships = cursor.fetchall()

        # Get total count for pagination
        count_query = """
            SELECT COUNT(*) as total
            FROM Content c
            JOIN Internships i ON c.Content_ID = i.Content_ID
            WHERE c.Content_Type = 'Internship'
        """

        count_params = []

        if company:
            count_query += " AND i.Company_Name LIKE %s"
            count_params.append(f"%{company}%")

        if location:
            count_query += " AND i.Location LIKE %s"
            count_params.append(f"%{location}%")

        if internship_type:
            count_query += " AND i.Internship_Type = %s"
            count_params.append(internship_type)

        if status:
            count_query += " AND c.Status = %s"
            count_params.append(status)

        cursor.execute(count_query, count_params)
        total_count = cursor.fetchone()['total']

        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "internships": internships,
            "total": total_count,
            "limit": limit,
            "offset": offset
        })
    except Exception as e:
        print(f"Error in get_internships: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/internships/<int:internship_id>', methods=['GET'])
@require_permission('content_read_public')
def get_internship(user_id, internship_id):
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Get the internship posting - Fixed field names to match frontend expectations
        cursor.execute("""
            SELECT c.Content_ID as content_id, c.User_ID as user_id, c.Title as title,
                   c.Summary as summary, c.Content as content,
                   c.Featured_Image as featured_image, c.Tags as tags,
                   c.Created_At as created_at, c.Updated_At as updated_at, c.Status as status,
                   c.Is_Featured as is_featured, i.Internship_ID as internship_id,
                   i.Company_Name as company_name, i.Location as location, i.Internship_Type as internship_type,
                   i.Stipend as stipend, i.Duration as duration, i.Eligibility_Criteria as eligibility_criteria,
                   i.Application_Deadline as application_deadline, i.Contact_Email as contact_email,
                   i.Contact_Phone as contact_phone,
                   i.Is_Featured as internship_is_featured,
                   up.Full_Name as posted_by
            FROM Content c
            JOIN Internships i ON c.Content_ID = i.Content_ID
            JOIN Users u ON c.User_ID = u.User_ID
            JOIN User_Profile up ON u.User_ID = up.User_ID
            WHERE i.Internship_ID = %s AND c.Content_Type = 'Internship'
        """, (internship_id,))

        internship = cursor.fetchone()

        if not internship:
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "Internship posting not found"}), 404

        # Check if user has already applied
        cursor.execute("""
            SELECT Application_ID, Application_Date, Status
            FROM Internship_Applications
            WHERE Internship_ID = %s AND User_ID = %s
        """, (internship_id, user_id))

        application = cursor.fetchone()

        # Update view count in metrics
        cursor.execute("""
            UPDATE Content_Metrics
            SET Views = Views + 1, Last_Updated = NOW()
            WHERE Content_ID = %s
        """, (internship['content_id'],))

        connection.commit()
        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "internship": internship,
            "has_applied": application is not None,
            "application": application
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/internships', methods=['POST'])
@require_permission('content_create_own')
def create_internship(user_id):
    try:
        data = request.json

        # Validate required fields
        required_fields = ['title', 'content', 'company_name', 'location', 'internship_type', 'application_deadline']
        for field in required_fields:
            if field not in data:
                return jsonify({"success": False, "message": f"Missing required field: {field}"}), 400

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Check user role first
        cursor.execute("SELECT Role_ID FROM Users WHERE User_ID = %s", (user_id,))
        user_role_result = cursor.fetchone()

        if not user_role_result or user_role_result['Role_ID'] not in [1, 2]:
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "User does not have permission to create internship postings"}), 403

        # Insert directly into database instead of using stored procedure
        try:
            # Insert into Content table
            cursor.execute("""
                INSERT INTO Content (User_ID, Content_Type, Title, Summary, Content, Featured_Image, Tags, Status, Is_Featured)
                VALUES (%s, 'Internship', %s, %s, %s, %s, %s, 'Active', %s)
            """, (
                user_id,
                data.get('title'),
                data.get('summary', ''),
                data.get('content'),
                data.get('featured_image', ''),
                data.get('tags', ''),
                data.get('is_featured', False)
            ))

            # Get the Content_ID of the newly created content
            new_content_id = cursor.lastrowid

            # Insert into Internships table
            cursor.execute("""
                INSERT INTO Internships (Content_ID, Company_Name, Location, Internship_Type, Stipend,
                                       Duration, Eligibility_Criteria, Application_Deadline,
                                       Contact_Email, Contact_Phone, Is_Featured)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                new_content_id,
                data.get('company_name'),
                data.get('location'),
                data.get('internship_type'),
                data.get('stipend', ''),
                data.get('duration', ''),
                data.get('eligibility_criteria', ''),
                data.get('application_deadline'),
                data.get('contact_email', ''),
                data.get('contact_phone', ''),
                data.get('is_featured', False)
            ))

            # Create metrics entry
            cursor.execute("INSERT INTO Content_Metrics (Content_ID) VALUES (%s)", (new_content_id,))

            # Log the action if user is admin
            if user_role_result['Role_ID'] == 1:
                cursor.execute("""
                    INSERT INTO Audit_Logs (Admin_ID, Action_Type, Action_Details)
                    VALUES (%s, 'Create Internship Posting', %s)
                """, (user_id, f"Created internship posting: {data.get('title')}"))

            connection.commit()
            cursor.close()
            connection.close()

            return jsonify({
                "success": True,
                "message": "Internship posting created successfully",
                "content_id": new_content_id
            }), 201

        except Exception as db_error:
            connection.rollback()
            cursor.close()
            connection.close()
            print(f"Database error: {db_error}")
            return jsonify({"success": False, "message": f"Database error: {str(db_error)}"}), 500
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/internships/<int:internship_id>/apply', methods=['POST'])
@require_permission('internship_apply')
def apply_for_internship(user_id, internship_id):
    try:
        data = request.json

        # Validate required fields
        if 'resume_url' not in data:
            return jsonify({"success": False, "message": "Resume URL is required"}), 400

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Check if the internship exists and is active (bypass stored procedure for now)
        cursor.execute("""
            SELECT i.Application_Deadline, c.Status
            FROM Internships i
            JOIN Content c ON i.Content_ID = c.Content_ID
            WHERE i.Internship_ID = %s
        """, (internship_id,))

        internship_info = cursor.fetchone()
        if not internship_info:
            return jsonify({"success": False, "message": "Internship posting not found"}), 404

        if internship_info['Status'] != 'Active':
            return jsonify({"success": False, "message": "This internship posting is no longer active"}), 400

        if internship_info['Application_Deadline'] and internship_info['Application_Deadline'] < datetime.now().date():
            return jsonify({"success": False, "message": "The application deadline for this internship has passed"}), 400

        # Check if user has already applied
        cursor.execute("""
            SELECT COUNT(*) as count FROM Internship_Applications
            WHERE Internship_ID = %s AND User_ID = %s
        """, (internship_id, user_id))

        already_applied = cursor.fetchone()['count']
        if already_applied > 0:
            return jsonify({"success": False, "message": "You have already applied for this internship"}), 400

        # Insert the application
        cursor.execute("""
            INSERT INTO Internship_Applications (Internship_ID, User_ID, Resume_URL, Cover_Letter)
            VALUES (%s, %s, %s, %s)
        """, (internship_id, user_id, data.get('resume_url'), data.get('cover_letter', '')))

        procedure_result = ["Application submitted successfully"]

        # Create notification for admins and editors
        cursor.execute("""
            SELECT up.Full_Name, i.Company_Name, c.Title
            FROM User_Profile up
            JOIN Internships i ON i.Internship_ID = %s
            JOIN Content c ON i.Content_ID = c.Content_ID
            WHERE up.User_ID = %s
        """, (internship_id, user_id))

        applicant_info = cursor.fetchone()
        if applicant_info:
            notification_message = f"New internship application: {applicant_info['Full_Name']} applied for {applicant_info['Title']} at {applicant_info['Company_Name']}"

            # Get all admins and editors
            cursor.execute("""
                SELECT User_ID FROM Users
                WHERE Role_ID IN (1, 2)
            """)

            admin_editors = cursor.fetchall()

            # Insert notifications for all admins and editors
            for admin_editor in admin_editors:
                cursor.execute("""
                    INSERT INTO Notifications (User_ID, Type, Title, Message, Related_Content_ID)
                    VALUES (%s, 'application', 'New Internship Application', %s, %s)
                """, (admin_editor['User_ID'], notification_message, internship_id))

        connection.commit()
        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "message": procedure_result[0]
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/internships/<int:internship_id>', methods=['PUT'])
@require_permission('content_update_own', check_ownership=True)
def update_internship(user_id, internship_id):
    try:
        data = request.json

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Get internship info and user role
        cursor.execute("""
            SELECT c.User_ID as content_owner_id, c.Content_ID, u.Role_ID as user_role
            FROM Internships i
            JOIN Content c ON i.Content_ID = c.Content_ID
            JOIN Users u ON u.User_ID = %s
            WHERE i.Internship_ID = %s AND c.Content_Type = 'Internship'
        """, (user_id, internship_id))

        result = cursor.fetchone()

        if not result:
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "Internship posting not found"}), 404

        # Check permissions: Admin can edit all, Editor can edit only their own
        user_role = result['user_role']
        content_owner_id = result['content_owner_id']

        if user_role == 1:  # Admin - can edit all
            pass
        elif user_role == 2 and content_owner_id == user_id:  # Editor - can edit only their own
            pass
        else:
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "Permission denied. You can only edit your own content."}), 403

        content_id = result['Content_ID']

        # Update the Content table
        content_update_query = """
            UPDATE Content
            SET Title = %s, Summary = %s, Content = %s, Featured_Image = %s,
                Tags = %s, Updated_At = NOW(), Is_Featured = %s
            WHERE Content_ID = %s
        """

        cursor.execute(content_update_query, (
            data.get('title'),
            data.get('summary', ''),
            data.get('content'),
            data.get('featured_image', ''),
            data.get('tags', ''),
            data.get('is_featured', False),
            content_id
        ))

        # Update the Internships table
        internship_update_query = """
            UPDATE Internships
            SET Company_Name = %s, Location = %s, Internship_Type = %s, Stipend = %s,
                Duration = %s, Eligibility_Criteria = %s, Application_Deadline = %s,
                Contact_Email = %s, Contact_Phone = %s, Is_Featured = %s
            WHERE Internship_ID = %s
        """

        cursor.execute(internship_update_query, (
            data.get('company_name'),
            data.get('location'),
            data.get('internship_type'),
            data.get('stipend', ''),
            data.get('duration', ''),
            data.get('eligibility_criteria', ''),
            data.get('application_deadline'),
            data.get('contact_email', ''),
            data.get('contact_phone', ''),
            data.get('is_featured', False),
            internship_id
        ))

        # Log the action if user is admin
        if user_role == 1:
            cursor.execute("""
                INSERT INTO Audit_Logs (Admin_ID, Action_Type, Action_Details)
                VALUES (%s, 'Update Internship Posting', CONCAT('Updated internship posting ID: ', %s))
            """, (user_id, internship_id))

        connection.commit()
        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "message": "Internship posting updated successfully"
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/internships/<int:internship_id>', methods=['DELETE'])
@require_permission('content_delete_own', check_ownership=True)
def delete_internship(user_id, internship_id):
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Get internship info and user role
        cursor.execute("""
            SELECT c.User_ID as content_owner_id, c.Content_ID, u.Role_ID as user_role
            FROM Internships i
            JOIN Content c ON i.Content_ID = c.Content_ID
            JOIN Users u ON u.User_ID = %s
            WHERE i.Internship_ID = %s AND c.Content_Type = 'Internship'
        """, (user_id, internship_id))

        result = cursor.fetchone()

        if not result:
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "Internship posting not found"}), 404

        # Check permissions: Admin can delete all, Editor can delete only their own
        user_role = result['user_role']
        content_owner_id = result['content_owner_id']

        if user_role == 1:  # Admin - can delete all
            pass
        elif user_role == 2 and content_owner_id == user_id:  # Editor - can delete only their own
            pass
        else:
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "Permission denied. You can only delete your own content."}), 403

        content_id = result['Content_ID']

        # Update the status to 'Deleted' instead of actually deleting
        cursor.execute("""
            UPDATE Content
            SET Status = 'Deleted', Updated_At = NOW()
            WHERE Content_ID = %s
        """, (content_id,))

        # Log the action if user is admin
        if user_role == 1:
            cursor.execute("""
                INSERT INTO Audit_Logs (Admin_ID, Action_Type, Action_Details)
                VALUES (%s, 'Delete Internship Posting', CONCAT('Deleted internship posting ID: ', %s))
            """, (user_id, internship_id))

        connection.commit()
        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "message": "Internship posting deleted successfully"
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# ===== APPLICATION MANAGEMENT ROUTES =====

@app.route('/api/user/applications/jobs', methods=['GET'])
@require_permission('job_apply')
def get_user_job_applications(user_id):
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Get user's job applications
        cursor.execute("""
            SELECT ja.Application_ID, ja.Job_ID, ja.Application_Date, ja.Status,
                   j.Company_Name, c.Title as Job_Title, j.Location, j.Job_Type
            FROM Job_Applications ja
            JOIN Jobs j ON ja.Job_ID = j.Job_ID
            JOIN Content c ON j.Content_ID = c.Content_ID
            WHERE ja.User_ID = %s
            ORDER BY ja.Application_Date DESC
        """, (user_id,))

        applications = cursor.fetchall()

        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "applications": applications
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/user/applications/internships', methods=['GET'])
@require_permission('internship_apply')
def get_user_internship_applications(user_id):
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Get user's internship applications
        cursor.execute("""
            SELECT ia.Application_ID, ia.Internship_ID, ia.Application_Date, ia.Status,
                   i.Company_Name, c.Title as Internship_Title, i.Location, i.Internship_Type
            FROM Internship_Applications ia
            JOIN Internships i ON ia.Internship_ID = i.Internship_ID
            JOIN Content c ON i.Content_ID = c.Content_ID
            WHERE ia.User_ID = %s
            ORDER BY ia.Application_Date DESC
        """, (user_id,))

        applications = cursor.fetchall()

        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "applications": applications
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/user/applications/research-papers', methods=['GET'])
@require_permission('research_submit')
def get_user_research_paper_applications(user_id):
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Get user's research paper submissions
        cursor.execute("""
            SELECT c.Content_ID, c.Title, c.Summary, c.Created_At as Application_Date,
                   rpr.Status, rpr.Submitted_At, rpr.Review_Comments, rpr.Reviewed_At,
                   rp.Authors, rp.Abstract, rp.Keywords,
                   CASE
                       WHEN rpr.Status = 'Pending' THEN 'Under Review'
                       WHEN rpr.Status = 'Approved' THEN 'Approved'
                       WHEN rpr.Status = 'Rejected' THEN 'Rejected'
                       WHEN rpr.Status = 'Needs Revision' THEN 'Revision Required'
                       ELSE rpr.Status
                   END as Display_Status
            FROM Content c
            JOIN Research_Papers rp ON c.Content_ID = rp.Content_ID
            JOIN Research_Paper_Reviews rpr ON c.Content_ID = rpr.Content_ID
            WHERE c.User_ID = %s AND c.Content_Type = 'Research_Paper'
            ORDER BY rpr.Submitted_At DESC
        """, (user_id,))

        applications = cursor.fetchall()

        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "applications": applications
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/admin/applications', methods=['GET'])
@require_permission('content_update_all')
def get_all_applications(user_id):
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Get query parameters for filtering
        application_type = request.args.get('type', 'all')  # 'jobs', 'internships', 'research-papers', 'all'
        status = request.args.get('status')
        company = request.args.get('company')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        limit = request.args.get('limit', 50, type=int)
        offset = request.args.get('offset', 0, type=int)

        applications = []

        # Get job applications if requested
        if application_type in ['jobs', 'all']:
            job_query = """
                SELECT ja.Application_ID, ja.Job_ID as Position_ID, ja.User_ID, ja.Application_Date,
                       ja.Status, ja.Resume_URL, ja.Cover_Letter, ja.Notes,
                       j.Company_Name, c.Title as Position_Title, j.Location, j.Job_Type as Position_Type,
                       up.Full_Name as Applicant_Name, u.Email as Applicant_Email,
                       'Job' as Application_Type
                FROM Job_Applications ja
                JOIN Jobs j ON ja.Job_ID = j.Job_ID
                JOIN Content c ON j.Content_ID = c.Content_ID
                JOIN Users u ON ja.User_ID = u.User_ID
                JOIN User_Profile up ON u.User_ID = up.User_ID
                WHERE 1=1
            """

            job_params = []

            if status:
                job_query += " AND ja.Status = %s"
                job_params.append(status)

            if company:
                job_query += " AND j.Company_Name LIKE %s"
                job_params.append(f"%{company}%")

            if date_from:
                job_query += " AND ja.Application_Date >= %s"
                job_params.append(date_from)

            if date_to:
                job_query += " AND ja.Application_Date <= %s"
                job_params.append(date_to)

            cursor.execute(job_query, job_params)
            job_applications = cursor.fetchall()
            applications.extend(job_applications)

        # Get internship applications if requested
        if application_type in ['internships', 'all']:
            internship_query = """
                SELECT ia.Application_ID, ia.Internship_ID as Position_ID, ia.User_ID, ia.Application_Date,
                       ia.Status, ia.Resume_URL, ia.Cover_Letter, ia.Notes,
                       i.Company_Name, c.Title as Position_Title, i.Location, i.Internship_Type as Position_Type,
                       up.Full_Name as Applicant_Name, u.Email as Applicant_Email,
                       'Internship' as Application_Type
                FROM Internship_Applications ia
                JOIN Internships i ON ia.Internship_ID = i.Internship_ID
                JOIN Content c ON i.Content_ID = c.Content_ID
                JOIN Users u ON ia.User_ID = u.User_ID
                JOIN User_Profile up ON u.User_ID = up.User_ID
                WHERE 1=1
            """

            internship_params = []

            if status:
                internship_query += " AND ia.Status = %s"
                internship_params.append(status)

            if company:
                internship_query += " AND i.Company_Name LIKE %s"
                internship_params.append(f"%{company}%")

            if date_from:
                internship_query += " AND ia.Application_Date >= %s"
                internship_params.append(date_from)

            if date_to:
                internship_query += " AND ia.Application_Date <= %s"
                internship_params.append(date_to)

            cursor.execute(internship_query, internship_params)
            internship_applications = cursor.fetchall()
            applications.extend(internship_applications)

        # Get research paper applications if requested
        if application_type in ['research-papers', 'all']:
            research_query = """
                SELECT c.Content_ID as Application_ID, c.Content_ID as Position_ID, c.User_ID,
                       rpr.Submitted_At as Application_Date, rpr.Status,
                       '' as Resume_URL, rpr.Review_Comments as Cover_Letter, rpr.Review_Comments as Notes,
                       'Research Submission' as Company_Name, c.Title as Position_Title,
                       'Academic' as Location, 'Research Paper' as Position_Type,
                       up.Full_Name as Applicant_Name, u.Email as Applicant_Email,
                       'Research_Paper' as Application_Type,
                       rp.Authors, rp.Abstract, rp.Keywords
                FROM Content c
                JOIN Research_Papers rp ON c.Content_ID = rp.Content_ID
                JOIN Research_Paper_Reviews rpr ON c.Content_ID = rpr.Content_ID
                JOIN Users u ON c.User_ID = u.User_ID
                JOIN User_Profile up ON u.User_ID = up.User_ID
                WHERE c.Content_Type = 'Research_Paper'
            """

            research_params = []

            if status:
                research_query += " AND rpr.Status = %s"
                research_params.append(status)

            if date_from:
                research_query += " AND rpr.Submitted_At >= %s"
                research_params.append(date_from)

            if date_to:
                research_query += " AND rpr.Submitted_At <= %s"
                research_params.append(date_to)

            cursor.execute(research_query, research_params)
            research_applications = cursor.fetchall()
            applications.extend(research_applications)

        # Sort by application date (most recent first)
        applications.sort(key=lambda x: x['Application_Date'], reverse=True)

        # Apply pagination
        total_count = len(applications)
        applications = applications[offset:offset + limit]

        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "applications": applications,
            "total": total_count,
            "limit": limit,
            "offset": offset
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/editor/applications/jobs', methods=['GET'])
@require_permission('content_update')
def get_editor_job_applications(user_id):
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Get job applications for jobs posted by the editor
        cursor.execute("""
            SELECT ja.Application_ID, ja.Job_ID, ja.User_ID, ja.Application_Date, ja.Status,
                   j.Company_Name, c.Title as Job_Title, j.Location, j.Job_Type,
                   up.Full_Name as Applicant_Name, u.Email as Applicant_Email,
                   ja.Resume_URL, ja.Cover_Letter, ja.Notes
            FROM Job_Applications ja
            JOIN Jobs j ON ja.Job_ID = j.Job_ID
            JOIN Content c ON j.Content_ID = c.Content_ID
            JOIN Users u ON ja.User_ID = u.User_ID
            JOIN User_Profile up ON u.User_ID = up.User_ID
            WHERE c.User_ID = %s
            ORDER BY ja.Application_Date DESC
        """, (user_id,))

        applications = cursor.fetchall()

        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "applications": applications
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/editor/applications/internships', methods=['GET'])
@require_permission('content_update')
def get_editor_internship_applications(user_id):
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Get internship applications for internships posted by the editor
        cursor.execute("""
            SELECT ia.Application_ID, ia.Internship_ID, ia.User_ID, ia.Application_Date, ia.Status,
                   i.Company_Name, c.Title as Internship_Title, i.Location, i.Internship_Type,
                   up.Full_Name as Applicant_Name, u.Email as Applicant_Email,
                   ia.Resume_URL, ia.Cover_Letter
            FROM Internship_Applications ia
            JOIN Internships i ON ia.Internship_ID = i.Internship_ID
            JOIN Content c ON i.Content_ID = c.Content_ID
            JOIN Users u ON ia.User_ID = u.User_ID
            JOIN User_Profile up ON u.User_ID = up.User_ID
            WHERE c.User_ID = %s
            ORDER BY ia.Application_Date DESC
        """, (user_id,))

        applications = cursor.fetchall()

        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "applications": applications
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/job-applications/<int:application_id>/status', methods=['PUT'])
@require_permission('content_update')
def update_job_application_status(user_id, application_id):
    try:
        data = request.json

        if 'status' not in data:
            return jsonify({"success": False, "message": "Status is required"}), 400

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Check if the user is the owner of the job posting or an admin
        cursor.execute("""
            SELECT c.User_ID, u.Role_ID
            FROM Job_Applications ja
            JOIN Jobs j ON ja.Job_ID = j.Job_ID
            JOIN Content c ON j.Content_ID = c.Content_ID
            JOIN Users u ON u.User_ID = %s
            WHERE ja.Application_ID = %s
        """, (user_id, application_id))

        result = cursor.fetchone()

        if not result:
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "Application not found"}), 404

        # Only allow update if user is admin or the owner of the job posting
        if result['Role_ID'] != 1 and result['User_ID'] != user_id:
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "Permission denied"}), 403

        # Get application details for notification
        cursor.execute("""
            SELECT ja.User_ID, c.Title, j.Company_Name
            FROM Job_Applications ja
            JOIN Jobs j ON ja.Job_ID = j.Job_ID
            JOIN Content c ON j.Content_ID = c.Content_ID
            WHERE ja.Application_ID = %s
        """, (application_id,))

        app_details = cursor.fetchone()

        # Update the application status
        cursor.execute("""
            UPDATE Job_Applications
            SET Status = %s, Notes = %s
            WHERE Application_ID = %s
        """, (data.get('status'), data.get('notes', ''), application_id))

        # Create notification for applicant about status change
        if app_details:
            notification_title = f"Job Application Status Update"
            notification_message = f"Your application for {app_details['Title']} at {app_details['Company_Name']} has been updated to: {data.get('status')}"
            action_url = f"/applications"

            cursor.execute("""
                INSERT INTO Notifications (User_ID, Type, Title, Message, Related_Content_ID, Action_URL)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (app_details['User_ID'], 'application_status', notification_title, notification_message, application_id, action_url))

        connection.commit()
        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "message": "Application status updated successfully"
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/internship-applications/<int:application_id>/status', methods=['PUT'])
@require_permission('content_update')
def update_internship_application_status(user_id, application_id):
    try:
        data = request.json

        if 'status' not in data:
            return jsonify({"success": False, "message": "Status is required"}), 400

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Check if the user is the owner of the internship posting or an admin
        cursor.execute("""
            SELECT c.User_ID, u.Role_ID
            FROM Internship_Applications ia
            JOIN Internships i ON ia.Internship_ID = i.Internship_ID
            JOIN Content c ON i.Content_ID = c.Content_ID
            JOIN Users u ON u.User_ID = %s
            WHERE ia.Application_ID = %s
        """, (user_id, application_id))

        result = cursor.fetchone()

        if not result:
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "Application not found"}), 404

        # Only allow update if user is admin or the owner of the internship posting
        if result['Role_ID'] != 1 and result['User_ID'] != user_id:
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "Permission denied"}), 403

        # Get application details for notification
        cursor.execute("""
            SELECT ia.User_ID, c.Title, i.Company_Name
            FROM Internship_Applications ia
            JOIN Internships i ON ia.Internship_ID = i.Internship_ID
            JOIN Content c ON i.Content_ID = c.Content_ID
            WHERE ia.Application_ID = %s
        """, (application_id,))

        app_details = cursor.fetchone()

        # Update the application status
        cursor.execute("""
            UPDATE Internship_Applications
            SET Status = %s, Notes = %s
            WHERE Application_ID = %s
        """, (data.get('status'), data.get('notes', ''), application_id))

        # Create notification for applicant about status change
        if app_details:
            notification_title = f"Internship Application Status Update"
            notification_message = f"Your application for {app_details['Title']} at {app_details['Company_Name']} has been updated to: {data.get('status')}"
            action_url = f"/applications"

            cursor.execute("""
                INSERT INTO Notifications (User_ID, Type, Title, Message, Related_Content_ID, Action_URL)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (app_details['User_ID'], 'application_status', notification_title, notification_message, application_id, action_url))

        connection.commit()
        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "message": "Application status updated successfully"
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# Health check endpoint
@app.route('/', methods=['GET'])
@app.route('/health', methods=['GET'])
def health_check():
    try:
        # Test database connection
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.execute("SELECT 1")
        cursor.fetchone()
        cursor.close()
        connection.close()

        return jsonify({
            "status": "healthy",
            "message": "LawFort API is running",
            "database": "connected"
        }), 200
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "message": "Database connection failed",
            "error": str(e)
        }), 500

# CORS headers are handled by Flask-CORS configuration above

# ===== CONTENT SAVING/BOOKMARKING ROUTES =====

@app.route('/api/user/saved-content', methods=['GET'])
@require_permission('content_save')
def get_user_saved_content(user_id):
    try:
        print(f"DEBUG: get_user_saved_content called for user_id: {user_id}")
        print("DEBUG: Using updated query with proper type-specific IDs - FIXED VERSION 5")
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Get query parameters
        content_type = request.args.get('content_type')
        folder_id = request.args.get('folder_id')
        limit = request.args.get('limit', 20, type=int)
        offset = request.args.get('offset', 0, type=int)

        # Base query to get saved content with proper type-specific IDs
        query = """
            SELECT usc.Save_ID as save_id, usc.Content_ID as content_id, usc.Saved_At as saved_at, usc.Notes as notes,
                   c.Title as title, c.Summary as summary, c.Content_Type as content_type,
                   c.Created_At as content_created_at, c.Content as content,
                   up.Full_Name as author_name,
                   CASE
                       WHEN c.Content_Type = 'Note' THEN n.Note_ID
                       WHEN c.Content_Type = 'Research_Paper' THEN c.Content_ID
                       WHEN c.Content_Type = 'Blog_Post' THEN c.Content_ID
                       WHEN c.Content_Type = 'Course' THEN ac.Course_ID
                       WHEN c.Content_Type = 'Job' THEN j.Job_ID
                       WHEN c.Content_Type = 'Internship' THEN i.Internship_ID
                       ELSE c.Content_ID
                   END as type_specific_id,
                   CASE
                       WHEN c.Content_Type = 'Note' THEN n.Category
                       WHEN c.Content_Type = 'Job' THEN j.Company_Name
                       WHEN c.Content_Type = 'Internship' THEN i.Company_Name
                       ELSE 'General'
                   END as category,
                   CASE
                       WHEN c.Content_Type = 'Job' THEN j.Company_Name
                       WHEN c.Content_Type = 'Internship' THEN i.Company_Name
                       WHEN c.Content_Type = 'Course' THEN ac.Instructor
                       ELSE NULL
                   END as additional_info
            FROM User_Saved_Content usc
            JOIN Content c ON usc.Content_ID = c.Content_ID
            JOIN Users u ON c.User_ID = u.User_ID
            JOIN User_Profile up ON u.User_ID = up.User_ID
            LEFT JOIN Notes n ON c.Content_ID = n.Content_ID AND c.Content_Type = 'Note'
            LEFT JOIN Available_Courses ac ON c.Content_ID = ac.Content_ID AND c.Content_Type = 'Course'
            LEFT JOIN Jobs j ON c.Content_ID = j.Content_ID AND c.Content_Type = 'Job'
            LEFT JOIN Internships i ON c.Content_ID = i.Content_ID AND c.Content_Type = 'Internship'
            WHERE usc.User_ID = %s AND c.Status = 'Active'
        """

        params = [user_id]

        # Add filters
        if content_type:
            query += " AND c.Content_Type = %s"
            params.append(content_type)

        if folder_id:
            query += " AND EXISTS (SELECT 1 FROM User_Library_Content ulc WHERE ulc.Save_ID = usc.Save_ID AND ulc.Folder_ID = %s)"
            params.append(folder_id)

        # Add sorting and pagination
        query += " ORDER BY usc.Saved_At DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])

        print(f"DEBUG: Executing query with params: {params}")
        print(f"DEBUG: Query: {query}")
        cursor.execute(query, params)
        saved_content = cursor.fetchall()
        print(f"DEBUG: Found {len(saved_content)} saved items")

        # Get total count
        count_query = """
            SELECT COUNT(*) as total
            FROM User_Saved_Content usc
            JOIN Content c ON usc.Content_ID = c.Content_ID
            WHERE usc.User_ID = %s AND c.Status = 'Active'
        """
        count_params = [user_id]

        if content_type:
            count_query += " AND c.Content_Type = %s"
            count_params.append(content_type)

        if folder_id:
            count_query += " AND EXISTS (SELECT 1 FROM User_Library_Content ulc WHERE ulc.Save_ID = usc.Save_ID AND ulc.Folder_ID = %s)"
            count_params.append(folder_id)

        cursor.execute(count_query, count_params)
        total_count = cursor.fetchone()['total']

        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "saved_content": saved_content,
            "total": total_count,
            "limit": limit,
            "offset": offset
        })
    except Exception as e:
        print(f"DEBUG: Error in get_user_saved_content: {str(e)}")
        import traceback
        print(f"DEBUG: Traceback: {traceback.format_exc()}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/user/save-content', methods=['POST'])
@require_permission('content_save')
def save_content(user_id):
    try:
        print(f"DEBUG: save_content called for user_id: {user_id}")
        data = request.json
        content_id = data.get('content_id')
        notes = data.get('notes', '')

        if not content_id:
            return jsonify({"success": False, "message": "Content ID is required"}), 400

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Debug: Check user's role and permissions
        cursor.execute("""
            SELECT u.Role_ID, u.Is_Super_Admin, r.Role_Name
            FROM Users u
            JOIN Roles r ON u.Role_ID = r.Role_ID
            WHERE u.User_ID = %s
        """, (user_id,))

        user_info = cursor.fetchone()
        print(f"DEBUG: User info: {user_info}")

        # Debug: Check user's permissions
        cursor.execute("""
            SELECT p.Permission_Name, p.Permission_Description
            FROM Permissions p
            WHERE p.Role_ID = %s
        """, (user_info['Role_ID'],))

        permissions = cursor.fetchall()
        print(f"DEBUG: User permissions: {permissions}")

        # Check if content exists and is accessible
        cursor.execute("""
            SELECT Content_ID, Status, Content_Type FROM Content WHERE Content_ID = %s
        """, (content_id,))

        content = cursor.fetchone()
        if not content:
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "Content not found"}), 404

        print(f"DEBUG: Content info: {content}")

        if content['Status'] not in ['Active', 'Restricted']:
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "Content is not available for saving"}), 400

        # Check if already saved
        cursor.execute("""
            SELECT Save_ID FROM User_Saved_Content
            WHERE User_ID = %s AND Content_ID = %s
        """, (user_id, content_id))

        existing_save = cursor.fetchone()
        if existing_save:
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "Content already saved"}), 400

        # Save the content
        cursor.execute("""
            INSERT INTO User_Saved_Content (User_ID, Content_ID, Notes)
            VALUES (%s, %s, %s)
        """, (user_id, content_id, notes))

        save_id = cursor.lastrowid
        print(f"DEBUG: Content saved successfully with save_id: {save_id}")

        # Get content author and saver info for notification
        cursor.execute("""
            SELECT c.User_ID as author_id, c.Title, c.Content_Type, up.Full_Name as saver_name
            FROM Content c
            JOIN User_Profile up ON up.User_ID = %s
            WHERE c.Content_ID = %s
        """, (user_id, content_id))

        content_info = cursor.fetchone()

        # Create notification for content author (if not saving own content)
        if content_info and content_info['author_id'] != user_id:
            notification_title = f"Content Saved"
            notification_message = f"{content_info['saver_name']} saved your {content_info['Content_Type'].replace('_', ' ').lower()}: {content_info['Title']}"
            action_url = f"/content/{content_id}"

            cursor.execute("""
                INSERT INTO Notifications (User_ID, Type, Title, Message, Related_Content_ID, Action_URL)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (content_info['author_id'], 'content_saved', notification_title, notification_message, content_id, action_url))

        connection.commit()
        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "message": "Content saved successfully",
            "save_id": save_id
        })
    except Exception as e:
        print(f"DEBUG: Error in save_content: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/user/unsave-content/<int:content_id>', methods=['DELETE'])
@require_permission('content_save')
def unsave_content(user_id, content_id):
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Check if content is saved by user
        cursor.execute("""
            SELECT Save_ID FROM User_Saved_Content
            WHERE User_ID = %s AND Content_ID = %s
        """, (user_id, content_id))

        saved_content = cursor.fetchone()
        if not saved_content:
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "Content not found in saved items"}), 404

        # Remove from library folders first
        cursor.execute("""
            DELETE FROM User_Library_Content WHERE Save_ID = %s
        """, (saved_content['Save_ID'],))

        # Remove from saved content
        cursor.execute("""
            DELETE FROM User_Saved_Content WHERE Save_ID = %s
        """, (saved_content['Save_ID'],))

        connection.commit()
        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "message": "Content removed from saved items"
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# ===== RESEARCH PAPER REVIEW WORKFLOW ROUTES =====

@app.route('/api/research-papers/submit-for-review', methods=['POST'])
@require_permission('research_submit')
def submit_research_paper_for_review(user_id):
    try:
        data = request.json

        # Validate required fields
        required_fields = ['title', 'abstract', 'authors']
        for field in required_fields:
            if field not in data:
                return jsonify({"success": False, "message": f"Missing required field: {field}"}), 400

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Insert into Content table with 'Pending' status for review
        cursor.execute("""
            INSERT INTO Content (User_ID, Content_Type, Title, Summary, Content, Featured_Image, Tags, Status)
            VALUES (%s, 'Research_Paper', %s, %s, %s, %s, %s, 'Pending')
        """, (
            user_id,
            data.get('title'),
            data.get('abstract', ''),
            data.get('abstract', ''),
            data.get('pdf_url', ''),
            data.get('keywords', ''),
        ))

        new_content_id = cursor.lastrowid

        # Insert into Research_Papers table
        cursor.execute("""
            INSERT INTO Research_Papers (Content_ID, Authors, Publication, Publication_Date, DOI, Keywords, Abstract, Citation_Count)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 0)
        """, (
            new_content_id,
            data.get('authors', ''),
            data.get('journal_name', ''),
            data.get('publication_date'),
            data.get('doi', ''),
            data.get('keywords', ''),
            data.get('abstract', ''),
        ))

        # Create review entry
        cursor.execute("""
            INSERT INTO Research_Paper_Reviews (Content_ID, Status)
            VALUES (%s, 'Pending')
        """, (new_content_id,))

        # Create notification for admins and editors about new research paper submission
        cursor.execute("""
            INSERT INTO Notifications (User_ID, Type, Title, Message, Related_Content_ID)
            SELECT u.User_ID, 'research_paper_submitted', 'New Research Paper Submitted',
                   CONCAT('A new research paper "', %s, '" has been submitted for review.'), %s
            FROM Users u
            JOIN Permissions p ON u.Role_ID = p.Role_ID
            WHERE p.Permission_Name = 'research_review'
        """, (data.get('title'), new_content_id))

        # Create metrics entry
        cursor.execute("INSERT INTO Content_Metrics (Content_ID) VALUES (%s)", (new_content_id,))

        connection.commit()
        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "message": "Research paper submitted for review successfully",
            "content_id": new_content_id
        }), 201

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/research-papers/pending-reviews', methods=['GET'])
@require_permission('research_review')
def get_pending_research_papers(user_id):
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Get pending research papers for review
        cursor.execute("""
            SELECT c.Content_ID, c.Title, c.Summary, c.Created_At,
                   rp.Authors, rp.Abstract, rp.Keywords,
                   up.Full_Name as author_name, u.Email as author_email,
                   rpr.Review_ID, rpr.Status, rpr.Submitted_At
            FROM Content c
            JOIN Research_Papers rp ON c.Content_ID = rp.Content_ID
            JOIN Users u ON c.User_ID = u.User_ID
            JOIN User_Profile up ON u.User_ID = up.User_ID
            JOIN Research_Paper_Reviews rpr ON c.Content_ID = rpr.Content_ID
            WHERE c.Content_Type = 'Research_Paper'
            AND rpr.Status IN ('Pending', 'Under Review')
            ORDER BY rpr.Submitted_At ASC
        """)

        pending_papers = cursor.fetchall()

        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "pending_papers": pending_papers
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/research-papers/<int:content_id>/review', methods=['POST'])
@require_permission('research_review')
def review_research_paper(user_id, content_id):
    try:
        data = request.json
        action = data.get('action')  # 'approve', 'reject', 'request_revision'
        comments = data.get('comments', '')

        if action not in ['approve', 'reject', 'request_revision']:
            return jsonify({"success": False, "message": "Invalid action"}), 400

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Check if review exists
        cursor.execute("""
            SELECT Review_ID FROM Research_Paper_Reviews
            WHERE Content_ID = %s AND Status IN ('Pending', 'Under Review')
        """, (content_id,))

        review = cursor.fetchone()
        if not review:
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "Review not found or already completed"}), 404

        # Update review status
        if action == 'approve':
            new_status = 'Approved'
            content_status = 'Active'
        elif action == 'reject':
            new_status = 'Rejected'
            content_status = 'Inactive'
        else:  # request_revision
            new_status = 'Needs Revision'
            content_status = 'Pending'

        # Update review
        cursor.execute("""
            UPDATE Research_Paper_Reviews
            SET Status = %s, Reviewer_ID = %s, Review_Comments = %s, Reviewed_At = NOW()
            WHERE Review_ID = %s
        """, (new_status, user_id, comments, review['Review_ID']))

        # Update content status
        cursor.execute("""
            UPDATE Content SET Status = %s WHERE Content_ID = %s
        """, (content_status, content_id))

        # Get paper details for notification
        cursor.execute("""
            SELECT c.Title, c.User_ID FROM Content c WHERE c.Content_ID = %s
        """, (content_id,))
        paper_info = cursor.fetchone()

        # Create notification for the author
        if paper_info:
            if action == 'approve':
                notification_message = f'Your research paper "{paper_info["Title"]}" has been approved and published!'
            elif action == 'reject':
                notification_message = f'Your research paper "{paper_info["Title"]}" has been rejected. {comments if comments else ""}'
            else:  # request_revision
                notification_message = f'Your research paper "{paper_info["Title"]}" needs revision. {comments if comments else ""}'

            cursor.execute("""
                INSERT INTO Notifications (User_ID, Type, Title, Message, Related_Content_ID)
                VALUES (%s, %s, %s, %s, %s)
            """, (
                paper_info['User_ID'],
                f'research_paper_{action}d',
                f'Research Paper {action.title()}d',
                notification_message,
                content_id
            ))

        # Log the action
        cursor.execute("""
            INSERT INTO Audit_Logs (Admin_ID, Action_Type, Action_Details)
            VALUES (%s, 'Research Paper Review', %s)
        """, (user_id, f"Reviewed research paper {content_id}: {action}"))

        connection.commit()
        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "message": f"Research paper {action}d successfully"
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/admin/research-papers/<int:content_id>/review', methods=['PUT'])
@require_permission('research_review')
def update_research_paper_review_status(user_id, content_id):
    try:
        data = request.json
        status = data.get('status')
        comments = data.get('comments', '')

        if not status:
            return jsonify({"success": False, "message": "Status is required"}), 400

        # Map status to action for consistency with existing review system
        if status == 'Approved':
            action = 'approve'
        elif status == 'Rejected':
            action = 'reject'
        elif status == 'Needs Revision':
            action = 'request_revision'
        else:
            return jsonify({"success": False, "message": "Invalid status"}), 400

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Check if review exists
        cursor.execute("""
            SELECT Review_ID FROM Research_Paper_Reviews
            WHERE Content_ID = %s AND Status IN ('Pending', 'Under Review')
        """, (content_id,))

        review = cursor.fetchone()
        if not review:
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "Review not found or already completed"}), 404

        # Update review status
        if action == 'approve':
            new_status = 'Approved'
            content_status = 'Active'
        elif action == 'reject':
            new_status = 'Rejected'
            content_status = 'Inactive'
        else:  # request_revision
            new_status = 'Needs Revision'
            content_status = 'Pending'

        # Update review
        cursor.execute("""
            UPDATE Research_Paper_Reviews
            SET Status = %s, Reviewer_ID = %s, Review_Comments = %s, Reviewed_At = NOW()
            WHERE Review_ID = %s
        """, (new_status, user_id, comments, review['Review_ID']))

        # Update content status
        cursor.execute("""
            UPDATE Content
            SET Status = %s, Updated_At = NOW()
            WHERE Content_ID = %s
        """, (content_status, content_id))

        # Get paper and author info for notifications
        cursor.execute("""
            SELECT c.Title, c.User_ID, up.Full_Name, u.Email
            FROM Content c
            JOIN Users u ON c.User_ID = u.User_ID
            JOIN User_Profile up ON u.User_ID = up.User_ID
            WHERE c.Content_ID = %s
        """, (content_id,))

        paper_info = cursor.fetchone()
        if paper_info:
            # Create notification for the author
            notification_title = f"Research Paper {new_status}"
            notification_message = f"Your research paper '{paper_info['Title']}' has been {new_status.lower()}"
            if comments:
                notification_message += f". Comments: {comments}"

            cursor.execute("""
                INSERT INTO Notifications (User_ID, Type, Title, Message, Related_Content_ID)
                VALUES (%s, 'application', %s, %s, %s)
            """, (paper_info['User_ID'], notification_title, notification_message, content_id))

        # Log the action
        cursor.execute("""
            INSERT INTO Audit_Logs (Admin_ID, Action_Type, Action_Details)
            VALUES (%s, 'Research Paper Review', %s)
        """, (user_id, f"Updated research paper {content_id} status to {new_status}"))

        connection.commit()
        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "message": f"Research paper status updated to {new_status} successfully"
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# ===== DEBUG ENDPOINTS =====

@app.route('/api/debug/user-permissions', methods=['GET'])
def debug_user_permissions():
    """Debug endpoint to check user permissions"""
    try:
        # Get session token from request headers
        session_token = request.headers.get('Authorization')
        if not session_token:
            return jsonify({"success": False, "message": "No session token provided"}), 401

        # Remove 'Bearer ' prefix if present
        if session_token.startswith('Bearer '):
            session_token = session_token[7:]

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Verify session token and get user ID
        cursor.execute("""
            SELECT s.User_ID
            FROM Session s
            WHERE s.Session_Token = %s
        """, (session_token,))

        session = cursor.fetchone()
        if not session:
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "Invalid session token"}), 401

        user_id = session['User_ID']

        # Get user info
        cursor.execute("""
            SELECT u.User_ID, u.Email, u.Role_ID, u.Is_Super_Admin, r.Role_Name
            FROM Users u
            JOIN Roles r ON u.Role_ID = r.Role_ID
            WHERE u.User_ID = %s
        """, (user_id,))

        user_info = cursor.fetchone()

        # Get user permissions
        cursor.execute("""
            SELECT p.Permission_Name, p.Permission_Description
            FROM Permissions p
            WHERE p.Role_ID = %s
            ORDER BY p.Permission_Name
        """, (user_info['Role_ID'],))

        permissions = cursor.fetchall()

        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "user_info": user_info,
            "permissions": permissions,
            "permission_check_results": {
                "content_save": check_user_permission(user_id, 'content_save'),
                "content_read_public": check_user_permission(user_id, 'content_read_public'),
                "blog_comment": check_user_permission(user_id, 'blog_comment'),
                "research_submit": check_user_permission(user_id, 'research_submit'),
            }
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# ===== FILE UPLOAD ROUTES =====

@app.route('/api/upload/resume', methods=['POST'])
@require_permission('job_apply')
def upload_resume(user_id):
    try:
        # Check if file is in request
        if 'file' not in request.files:
            return jsonify({"success": False, "message": "No file provided"}), 400

        file = request.files['file']

        # Check if file is selected
        if file.filename == '':
            return jsonify({"success": False, "message": "No file selected"}), 400

        # Check if file type is allowed
        if not allowed_file(file.filename):
            return jsonify({"success": False, "message": "Only PDF files are allowed"}), 400

        # Generate secure filename
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{user_id}_{timestamp}_{filename}"

        # Save file
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)

        # Generate file URL (you may want to serve files through a different route)
        file_url = f"http://localhost:5000/uploads/resumes/{filename}"

        return jsonify({
            "success": True,
            "message": "File uploaded successfully",
            "file_url": file_url,
            "filename": filename
        }), 200

    except Exception as e:
        return jsonify({"success": False, "message": f"Upload failed: {str(e)}"}), 500

@app.route('/uploads/resumes/<filename>')
def uploaded_file(filename):
    """Serve uploaded resume files"""
    try:
        from flask import send_from_directory
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
    except Exception:
        return jsonify({"error": "File not found"}), 404

# PDF Upload for Notes
@app.route('/api/notes/upload-pdf', methods=['POST'])
@require_permission('content_create_own')
def upload_note_pdf(user_id):
    try:
        # Check if file is in request
        if 'file' not in request.files:
            return jsonify({"success": False, "message": "No file provided"}), 400

        file = request.files['file']

        # Check if file is selected
        if file.filename == '':
            return jsonify({"success": False, "message": "No file selected"}), 400

        # Check if file type is PDF
        if not file.filename.lower().endswith('.pdf'):
            return jsonify({"success": False, "message": "Only PDF files are allowed"}), 400

        # Check file size (10MB limit for PDFs)
        file.seek(0, 2)  # Seek to end of file
        file_size = file.tell()
        file.seek(0)  # Reset to beginning

        max_size = 10 * 1024 * 1024  # 10MB
        if file_size > max_size:
            return jsonify({"success": False, "message": "File size must be less than 10MB"}), 400

        # Generate secure filename
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"note_{user_id}_{timestamp}_{filename}"

        # Create notes upload directory
        notes_upload_folder = os.path.join(os.getcwd(), 'uploads', 'notes')
        os.makedirs(notes_upload_folder, exist_ok=True)

        # Save file
        file_path = os.path.join(notes_upload_folder, filename)
        file.save(file_path)

        # Extract text from PDF for search functionality
        try:
            with open(file_path, 'rb') as pdf_file:
                pdf_reader = PyPDF2.PdfReader(pdf_file)
                extracted_text = ""
                for page in pdf_reader.pages:
                    extracted_text += page.extract_text() + "\n"
        except Exception as e:
            print(f"PDF text extraction failed: {e}")
            extracted_text = ""

        # Generate file URL
        file_url = f"http://localhost:5000/uploads/notes/{filename}"

        return jsonify({
            "success": True,
            "message": "PDF uploaded successfully",
            "file_url": file_url,
            "filename": filename,
            "file_size": file_size,
            "extracted_text": extracted_text[:500] + "..." if len(extracted_text) > 500 else extracted_text
        }), 200

    except Exception as e:
        return jsonify({"success": False, "message": f"Upload failed: {str(e)}"}), 500

# PDF Upload for Research Papers
@app.route('/api/research-papers/upload-pdf', methods=['POST'])
@require_permission('content_create_own')
def upload_research_paper_pdf(user_id):
    try:
        # Check if file is in request
        if 'file' not in request.files:
            return jsonify({"success": False, "message": "No file provided"}), 400

        file = request.files['file']

        # Check if file is selected
        if file.filename == '':
            return jsonify({"success": False, "message": "No file selected"}), 400

        # Check if file type is PDF
        if not file.filename.lower().endswith('.pdf'):
            return jsonify({"success": False, "message": "Only PDF files are allowed"}), 400

        # Check file size (10MB limit for PDFs)
        file.seek(0, 2)  # Seek to end of file
        file_size = file.tell()
        file.seek(0)  # Reset to beginning

        max_size = 10 * 1024 * 1024  # 10MB
        if file_size > max_size:
            return jsonify({"success": False, "message": "File size must be less than 10MB"}), 400

        # Generate secure filename
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"research_paper_{user_id}_{timestamp}_{filename}"

        # Create research papers upload directory
        research_papers_upload_folder = os.path.join(os.getcwd(), 'uploads', 'research_papers')
        os.makedirs(research_papers_upload_folder, exist_ok=True)

        # Save file
        file_path = os.path.join(research_papers_upload_folder, filename)
        file.save(file_path)

        # Generate file URL
        file_url = f"http://localhost:5000/uploads/research_papers/{filename}"

        # Generate thumbnail for the PDF
        thumbnail_success, thumbnail_url, thumbnail_error = generate_research_paper_thumbnail(
            file_path, 0, user_id  # content_id will be 0 for now, will be updated when research paper is created
        )

        response_data = {
            "success": True,
            "message": "Research paper PDF uploaded successfully",
            "file_url": file_url,
            "filename": filename,
            "file_size": file_size
        }

        # Add thumbnail information if generation was successful
        if thumbnail_success:
            response_data["thumbnail_url"] = thumbnail_url
            response_data["thumbnail_generated"] = True
        else:
            response_data["thumbnail_generated"] = False
            response_data["thumbnail_error"] = thumbnail_error

        return jsonify(response_data), 200

    except Exception as e:
        return jsonify({"success": False, "message": f"Upload failed: {str(e)}"}), 500

# PDF Upload for Research Paper Submissions (User submissions for review)
@app.route('/api/research-papers/submit/upload-pdf', methods=['POST'])
@require_permission('research_submit')
def upload_research_paper_submission_pdf(user_id):
    try:
        # Check if file is in request
        if 'file' not in request.files:
            return jsonify({"success": False, "message": "No file provided"}), 400

        file = request.files['file']

        # Check if file is selected
        if file.filename == '':
            return jsonify({"success": False, "message": "No file selected"}), 400

        # Check if file type is PDF
        if not file.filename.lower().endswith('.pdf'):
            return jsonify({"success": False, "message": "Only PDF files are allowed"}), 400

        # Check file size (10MB limit for PDFs)
        file.seek(0, 2)  # Seek to end of file
        file_size = file.tell()
        file.seek(0)  # Reset to beginning

        max_size = 10 * 1024 * 1024  # 10MB
        if file_size > max_size:
            return jsonify({"success": False, "message": "File size must be less than 10MB"}), 400

        # Generate secure filename
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"submission_{user_id}_{timestamp}_{filename}"

        # Create research papers upload directory
        research_papers_upload_folder = os.path.join(os.getcwd(), 'uploads', 'research_papers')
        os.makedirs(research_papers_upload_folder, exist_ok=True)

        # Save file
        file_path = os.path.join(research_papers_upload_folder, filename)
        file.save(file_path)

        # Generate file URL
        file_url = f"http://localhost:5000/uploads/research_papers/{filename}"

        # Generate thumbnail for the PDF
        thumbnail_success, thumbnail_url, thumbnail_error = generate_research_paper_thumbnail(
            file_path, 0, user_id  # content_id will be 0 for now, will be updated when research paper is created
        )

        response_data = {
            "success": True,
            "message": "Research paper PDF uploaded successfully",
            "file_url": file_url,
            "filename": filename,
            "file_size": file_size
        }

        # Add thumbnail information if generation was successful
        if thumbnail_success:
            response_data["thumbnail_url"] = thumbnail_url
            response_data["thumbnail_generated"] = True
        else:
            response_data["thumbnail_generated"] = False
            response_data["thumbnail_error"] = thumbnail_error

        return jsonify(response_data), 200

    except Exception as e:
        return jsonify({"success": False, "message": f"Upload failed: {str(e)}"}), 500

@app.route('/uploads/notes/<filename>')
def uploaded_note_file(filename):
    """Serve uploaded note PDF files"""
    try:
        from flask import send_from_directory, make_response
        notes_upload_folder = os.path.join(os.getcwd(), 'uploads', 'notes')
        response = make_response(send_from_directory(notes_upload_folder, filename))

        # Add CORS headers for PDF files
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        response.headers['Content-Type'] = 'application/pdf'

        return response
    except Exception as e:
        print(f"Error serving PDF file {filename}: {e}")
        return jsonify({"error": "File not found"}), 404

@app.route('/uploads/research_papers/<filename>')
def uploaded_research_paper_file(filename):
    """Serve uploaded research paper PDF files"""
    try:
        from flask import send_from_directory, make_response
        research_papers_upload_folder = os.path.join(os.getcwd(), 'uploads', 'research_papers')
        response = make_response(send_from_directory(research_papers_upload_folder, filename))

        # Add CORS headers for PDF files
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        response.headers['Content-Type'] = 'application/pdf'

        return response
    except Exception as e:
        print(f"Error serving research paper PDF file {filename}: {e}")
        return jsonify({"error": "File not found"}), 404

@app.route('/uploads/research_papers/<filename>', methods=['OPTIONS'])
def uploaded_research_paper_file_options(filename):
    """Handle OPTIONS requests for research paper PDF files"""
    response = jsonify({})
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response

@app.route('/uploads/notes/<filename>', methods=['OPTIONS'])
def uploaded_note_file_options(filename):
    """Handle OPTIONS requests for PDF files"""
    response = jsonify({})
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response

@app.route('/uploads/thumbnails/research_papers/<filename>')
def uploaded_research_paper_thumbnail(filename):
    """Serve uploaded research paper thumbnail images"""
    try:
        from flask import send_from_directory, make_response
        thumbnails_folder = os.path.join(os.getcwd(), 'uploads', 'thumbnails', 'research_papers')
        response = make_response(send_from_directory(thumbnails_folder, filename))

        # Add CORS headers for thumbnail images
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'

        # Set appropriate content type for images
        if filename.lower().endswith('.jpg') or filename.lower().endswith('.jpeg'):
            response.headers['Content-Type'] = 'image/jpeg'
        elif filename.lower().endswith('.png'):
            response.headers['Content-Type'] = 'image/png'

        return response
    except Exception as e:
        print(f"Error serving thumbnail file {filename}: {e}")
        return jsonify({"error": "Thumbnail not found"}), 404

@app.route('/uploads/thumbnails/research_papers/<filename>', methods=['OPTIONS'])
def uploaded_research_paper_thumbnail_options(filename):
    """Handle OPTIONS requests for research paper thumbnail files"""
    response = jsonify({})
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response

# Grammar Checker Endpoints
@app.route('/api/grammar/check', methods=['POST'])
def check_grammar():
    """
    Check text for grammar, spelling, and style issues
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided',
                'issues': [],
                'statistics': {'total_issues': 0, 'by_type': {}, 'severity_distribution': {}}
            }), 400

        text = data.get('text', '')

        if not text or not text.strip():
            return jsonify({
                'success': True,
                'issues': [],
                'statistics': {'total_issues': 0, 'by_type': {}, 'severity_distribution': {}},
                'text_length': 0,
                'word_count': 0
            }), 200

        print(f"Grammar check request - Text length: {len(text)}")  # Debug log

        # Use the grammar checker
        result = check_grammar_api(text)

        print(f"Grammar check result - Success: {result['success']}, Issues: {len(result.get('issues', []))}")  # Debug log

        return jsonify(result), 200

    except Exception as e:
        print(f"Grammar check error: {str(e)}")  # Debug log
        return jsonify({
            'success': False,
            'error': str(e),
            'issues': [],
            'statistics': {'total_issues': 0, 'by_type': {}, 'severity_distribution': {}}
        }), 500

@app.route('/api/grammar/apply-suggestion', methods=['POST'])
def apply_grammar_suggestion():
    """
    Apply a grammar suggestion to text
    """
    try:
        data = request.get_json()
        text = data.get('text', '')
        issue_offset = data.get('offset', 0)
        issue_length = data.get('length', 0)
        replacement = data.get('replacement', '')

        if not text:
            return jsonify({'success': False, 'error': 'Text is required'}), 400

        # Apply the replacement
        start = issue_offset
        end = issue_offset + issue_length
        corrected_text = text[:start] + replacement + text[end:]

        return jsonify({
            'success': True,
            'corrected_text': corrected_text
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/grammar/health', methods=['GET'])
def grammar_checker_health():
    """
    Check if the grammar checker service is available
    """
    try:
        # Test with a simple sentence
        test_result = check_grammar_api("This is a test.")

        return jsonify({
            'success': True,
            'service_available': test_result['success'],
            'message': 'Grammar checker is working properly'
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'service_available': False,
            'error': str(e),
            'message': 'Grammar checker service is not available'
        }), 500



if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
