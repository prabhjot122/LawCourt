# LawFort Backend Setup Guide

## Prerequisites
- MySQL 8.0 or higher
- Python 3.8 or higher
- At least 1GB free disk space

## Quick Setup (3 Steps Only!)

### 1. Database Setup
```bash
# Create database and import complete schema with data
mysql -u root -p < lawfortdb.sql
```

### 2. Environment Configuration
Create a `.env` file in the Backend directory:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=lawfort
DB_POOL_SIZE=5
SECRET_KEY=your_secret_key_here
```

### 3. Install Dependencies & Start
```bash
# Install Python dependencies
pip install -r requirements.txt

# Start the backend server
python app.py
```

The backend will be available at `http://localhost:5000`

## ✅ What the SQL File Includes
The `lawfortdb.sql` file is **complete and self-contained**:
- ✅ All database tables and relationships
- ✅ All stored procedures and functions
- ✅ Default admin user and roles
- ✅ Sample data for testing
- ✅ Proper indexes and constraints

**No additional setup scripts needed!**

## Default Admin Account

After running the database setup, you'll have a default admin account for initial system access:

### 🔐 Default Credentials:
- **Email:** `admin@lawfort.com`
- **Password:** `admin123`

### ⚠️ IMPORTANT SECURITY NOTES:
1. **Change the default password immediately** after first login
2. The admin account has full system privileges including:
   - User management and role assignment
   - Content moderation and management
   - System configuration access
   - Access request approval/denial
3. The password is securely hashed using bcrypt
4. Consider creating additional admin users and disabling the default account

### Additional Test Accounts:
- **Editor**: `editor@lawfort.com` / `editor123`

### Creating Additional Admin Users:
Use the admin dashboard or directly insert into the database with proper password hashing.

## API Endpoints

### Authentication
- `POST /register` - User registration
- `POST /login` - User login
- `POST /logout` - User logout
- `GET /user/validate_session` - Validate session token
- `GET /user/profile` - Get user profile

### User Management
- `POST /request_editor_access` - Request editor access

### Admin Functions
- `GET /admin/access_requests` - Get pending access requests
- `POST /admin/approve_deny_access` - Approve/deny access requests

## Database Schema

### Tables Created:
- `Roles` - User roles (Admin, Editor, User)
- `Users` - User accounts
- `User_Profile` - User profile information
- `Access_Request` - Editor access requests
- `Session` - User sessions
- `Audit_Logs` - Admin action logs
- `OAuth_Providers` - OAuth authentication data

## Troubleshooting

### Connection Issues
1. Check your MySQL server is running
2. Verify database credentials in `.env` file
3. Ensure the `lawfort` database was created successfully

### Import Issues
If the SQL import fails:
1. Ensure MySQL is running and accessible
2. Check that you have sufficient privileges
3. Verify the `lawfortdb.sql` file is complete and not corrupted

### CORS Issues
The backend includes CORS headers for development. For production, configure CORS properly.

## Development Notes

- Passwords are hashed using bcrypt
- Session tokens are UUIDs stored in the database
- Role-based access control is implemented
- All API responses are in JSON format

## Production Deployment

For production deployment:
1. Use environment variables for all sensitive data
2. Configure proper CORS settings
3. Use a production WSGI server (gunicorn, uWSGI)
4. Set up proper database connection pooling
5. Enable SSL/HTTPS
6. Configure proper logging
