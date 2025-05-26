# 🚨 Quick Fix Guide for LawFort OAuth & Email Issues

## 🔧 Step 1: Fix Database Issues

### Run the Migration Script (Windows)
```bash
cd Backend
python migrate_oauth_email.py
```

**Note**: If you get `/usr/bin/env` error, just run `python migrate_oauth_email.py` directly.

If the script fails, manually run these SQL commands:

```sql
USE LawFort;

-- Add OAuth columns to Users table
ALTER TABLE Users ADD COLUMN IF NOT EXISTS Auth_Provider VARCHAR(20) DEFAULT 'local';
ALTER TABLE Users ADD COLUMN IF NOT EXISTS OAuth_ID VARCHAR(255);
ALTER TABLE Users ADD COLUMN IF NOT EXISTS Profile_Complete BOOLEAN DEFAULT TRUE;

-- Create Email_Logs table
CREATE TABLE IF NOT EXISTS Email_Logs (
    Email_ID INT AUTO_INCREMENT PRIMARY KEY,
    Sender_ID INT,
    Recipient_IDs TEXT,
    Subject VARCHAR(255),
    Content TEXT,
    Email_Type VARCHAR(50) DEFAULT 'announcement',
    Status VARCHAR(20) DEFAULT 'sent',
    Sent_At DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Sender_ID) REFERENCES Users(User_ID)
);

-- Create OAuth_Providers table
CREATE TABLE IF NOT EXISTS OAuth_Providers (
    Provider_ID INT AUTO_INCREMENT PRIMARY KEY,
    User_ID INT,
    Provider_Name VARCHAR(50) NOT NULL,
    Provider_User_ID VARCHAR(255) NOT NULL,
    Access_Token TEXT,
    Refresh_Token TEXT,
    Token_Expires_At DATETIME,
    Created_At DATETIME DEFAULT CURRENT_TIMESTAMP,
    Updated_At DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (User_ID) REFERENCES Users(User_ID),
    UNIQUE KEY unique_provider_user (Provider_Name, Provider_User_ID)
);

-- Update existing users
UPDATE Users SET Profile_Complete = TRUE WHERE Auth_Provider = 'local' OR Auth_Provider IS NULL;
```

## 🔧 Step 2: Install SendGrid and Configure Email

### Install SendGrid Package
```bash
cd Backend
pip install sendgrid==6.10.0
```

### Configure SendGrid in .env file:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_database_password
DB_NAME=LawFort

# SendGrid Email Configuration
SENDGRID_API_KEY=SG.your_sendgrid_api_key_here
FROM_EMAIL=your_verified_sender@yourdomain.com

# Flask Configuration
SECRET_KEY=your_secret_key_here
```

### SendGrid Setup:
1. Create account at [SendGrid.com](https://sendgrid.com)
2. Generate API key with Mail Send permissions
3. Verify your sender email address
4. Use API key and verified email in .env file

**See `SENDGRID_SETUP_GUIDE.md` for detailed instructions**

## 🔧 Step 3: Fix Google OAuth (Temporary Solution)

For development/testing, you have two options:

### Option A: Create Your Own Google OAuth App (Recommended)
1. Go to [Google Cloud Console](https://console.developers.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add `http://localhost:5173` to authorized origins
6. Replace the client ID in `src/App.tsx`

### Option B: Disable Google OAuth for Testing
Comment out the Google OAuth buttons temporarily:

In `src/pages/Login.tsx` and `src/pages/Signup.tsx`, comment out:
```tsx
// <div className="mt-6">
//   <GoogleOAuthButton ... />
// </div>
```

## 🔧 Step 4: Restart Services

```bash
# Backend
cd Backend
python app.py

# Frontend (new terminal)
npm run dev
```

## 🔧 Step 5: Test Email System

1. Login as admin user
2. Go to Admin Dashboard → Email Management
3. Click "Compose Email"
4. Select test users
5. Send test email

## 🔧 Step 6: Verify Database Tables

Run this SQL to verify tables exist:

```sql
SHOW TABLES;
DESCRIBE Users;
DESCRIBE Email_Logs;
```

Expected Users table columns should include:
- Auth_Provider
- OAuth_ID
- Profile_Complete

## 🚨 Common Issues & Solutions

### Issue: "Table 'email_logs' doesn't exist"
**Solution**: Run the migration script or create the table manually

### Issue: "Unknown column 'Profile_Complete'"
**Solution**: Add the column: `ALTER TABLE Users ADD COLUMN Profile_Complete BOOLEAN DEFAULT TRUE;`

### Issue: "Failed to send email"
**Solutions**:
- Check SendGrid API key setup
- Verify SENDGRID_API_KEY and FROM_EMAIL in .env
- Ensure sender email is verified in SendGrid dashboard

### Issue: Google OAuth domain error
**Solutions**:
- Create your own Google OAuth app
- Add localhost:5173 to authorized origins
- Or temporarily disable OAuth for testing

### Issue: "OAuthProfileCompletion is not defined"
**Solution**: Clear browser cache and restart dev server

## 🎯 Quick Test Checklist

After fixes:
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can access admin dashboard
- [ ] Email management tab loads
- [ ] Can select users for email
- [ ] Email sending works (check logs)
- [ ] Database has all required tables

## 📞 Still Having Issues?

1. Check browser console for errors
2. Check backend terminal for errors
3. Verify database connection
4. Ensure all dependencies are installed:
   ```bash
   cd Backend
   pip install -r requirements.txt

   cd ..
   npm install
   ```

The email system should work immediately after database migration. Google OAuth requires proper setup but can be tested later.
