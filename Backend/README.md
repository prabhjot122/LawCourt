# LawFort Backend Setup Guide

## Quick Setup

### 1. Database Setup

**Option A: Automatic Setup (Recommended)**
```bash
cd Backend
python setup_database.py
```

**Option B: Manual Setup**
```bash
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

### 3. Install Dependencies

```bash
pip install flask python-dotenv mysql-connector-python bcrypt uuid
```

### 4. Start the Backend

```bash
python app.py
```

The backend will be available at `http://localhost:5000`

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
Use the provided utility script:
```bash
python create_admin.py
```

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

### Email Functionality
**Note**: Email functionality has been removed from the backend and database. The email-related endpoints now return dummy data for frontend compatibility:
- `/admin/send_email` - Returns success response without sending emails
- `/admin/email_logs` - Returns sample email log data
- `/admin/users_for_email` - Returns user list (unchanged)

To remove email tables from existing databases, run:
```bash
python remove_email_db.py
```

## Troubleshooting

### Foreign Key Constraint Error
If you get a foreign key constraint error during registration:
1. Run the database setup script: `python setup_database.py`
2. This will ensure all required roles exist

### Connection Issues
1. Check your MySQL server is running
2. Verify database credentials in `.env` file
3. Ensure the `lawfort` database exists

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
