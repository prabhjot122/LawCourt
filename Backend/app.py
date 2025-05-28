import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from mysql.connector import pooling
import bcrypt
import uuid
from datetime import datetime
from flask_cors import CORS
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

# Load environment variables from .env file
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
# Enable CORS for all routes
CORS(app, resources={r"/*": {"origins": "*"}})

# MySQL Connection Pool Configuration
db_config = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', 'pabbo@123'),  # Default to your current password if env var not set
    'database': os.getenv('DB_NAME', 'LawFort'),
    'pool_name': 'lawfort_pool',
    'pool_size': int(os.getenv('DB_POOL_SIZE', 5))
}

# Create connection pool
connection_pool = pooling.MySQLConnectionPool(**db_config)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'pabbo@123')

# Google OAuth Configuration
GOOGLE_CLIENT_ID = "517818204697-jpimspqvc3f4folciiapr6vbugs9t7hu.apps.googleusercontent.com"

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
        # Verify the token with Google
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), GOOGLE_CLIENT_ID)

        # Check if the token is valid
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise ValueError('Wrong issuer.')

        return {
            'google_id': idinfo['sub'],
            'email': idinfo['email'],
            'name': idinfo.get('name', ''),
            'picture': idinfo.get('picture', ''),
            'email_verified': idinfo.get('email_verified', False)
        }
    except ValueError as e:
        print(f"Token verification failed: {e}")
        return None

# Dummy function to simulate email sending (for frontend compatibility)
def send_email(to_emails, subject, content, _sender_id=None):
    """
    Dummy email function that simulates successful email sending
    without actually sending emails or logging to database
    """
    try:
        # Ensure to_emails is a list
        if isinstance(to_emails, str):
            to_emails = [to_emails]

        print(f"DUMMY EMAIL: Would send email to {len(to_emails)} recipients")
        print(f"Subject: {subject}")
        print(f"Content preview: {content[:100]}...")

        # Always return True to simulate successful sending
        return True

    except Exception as e:
        print(f"Error in dummy email function: {e}")
        return False

# Dummy function to simulate email logging (removed database logging)
def log_email_in_db(sender_id, _recipient_emails, _subject, _content, status):
    """
    Dummy function that simulates email logging without database operations
    """
    print(f"DUMMY LOG: Would log email from sender {sender_id} with status {status}")
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

        print(f"DUMMY EMAIL SEND:")
        print(f"  Admin ID: {admin_id}")
        print(f"  Recipients: {recipient_count} users")
        print(f"  Subject: {subject}")
        print(f"  Type: {email_type}")
        print(f"  Content preview: {content[:100]}...")

        # Always return success for frontend compatibility
        return jsonify({
            'message': f'Email sent successfully to {recipient_count} recipients',
            'recipients_count': recipient_count
        }), 200

    except Exception as e:
        print(f"Error in dummy email endpoint: {e}")
        return jsonify({'error': 'Failed to send email'}), 500

@app.route('/admin/email_logs', methods=['GET'])
def get_email_logs():
    """
    Dummy email logs endpoint that returns sample email log data
    for frontend compatibility without database operations.
    """
    try:
        # Generate dummy email logs for frontend display
        dummy_email_logs = [
            {
                'email_id': 1,
                'sender_id': 1,
                'sender_name': 'Admin User',
                'recipient_count': 5,
                'subject': 'Welcome to LawFort Platform',
                'email_type': 'announcement',
                'status': 'sent',
                'sent_at': '2024-01-15T10:30:00'
            },
            {
                'email_id': 2,
                'sender_id': 1,
                'sender_name': 'Admin User',
                'recipient_count': 3,
                'subject': 'System Maintenance Notification',
                'email_type': 'notification',
                'status': 'sent',
                'sent_at': '2024-01-14T14:15:00'
            },
            {
                'email_id': 3,
                'sender_id': 1,
                'sender_name': 'Admin User',
                'recipient_count': 8,
                'subject': 'Test Email - Platform Features',
                'email_type': 'test',
                'status': 'sent',
                'sent_at': '2024-01-13T09:45:00'
            }
        ]

        print("DUMMY EMAIL LOGS: Returning sample email logs for frontend")
        return jsonify({'email_logs': dummy_email_logs}), 200

    except Exception as e:
        print(f"Error in dummy email logs endpoint: {e}")
        return jsonify({'error': str(e)}), 500

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

# Add CORS headers for frontend integration
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

if __name__ == '__main__':
    app.run(debug=True)
