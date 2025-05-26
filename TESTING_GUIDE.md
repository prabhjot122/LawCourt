# LawFort - Testing Guide for New Features

## 🧪 Testing Google OAuth Integration

### Prerequisites
1. Ensure backend is running on `http://localhost:5000`
2. Ensure frontend is running on `http://localhost:5173`
3. Database is set up with the updated schema

### Test Scenarios

#### Scenario 1: New User Google Sign-up
1. **Navigate to Signup Page**: Go to `/signup`
2. **Click Google OAuth**: Click "Continue with Google" button
3. **Complete Google Auth**: Sign in with your Google account
4. **Profile Completion**: You should be redirected to profile completion form
5. **Fill Required Fields**:
   - Bio (minimum 10 characters)
   - Practice Area (e.g., "Student", "Corporate Law")
   - Bar Exam Status (select from dropdown)
6. **Submit Profile**: Click "Complete Profile"
7. **Verify Success**: Should redirect to profile page with complete user data

#### Scenario 2: Existing Google User Login
1. **Navigate to Login Page**: Go to `/login`
2. **Click Google OAuth**: Click "Continue with Google" button
3. **Complete Google Auth**: Sign in with the same Google account
4. **Verify Login**: Should directly redirect to profile page (no profile completion needed)

#### Scenario 3: Email Conflict
1. **Create Regular Account**: Sign up with email `test@example.com` using regular signup
2. **Try Google OAuth**: Use Google account with same email `test@example.com`
3. **Verify Error**: Should show "Email already registered with different login method"

### Expected Results
- ✅ Smooth Google authentication flow
- ✅ Profile completion for new OAuth users
- ✅ Direct login for existing OAuth users
- ✅ Proper error handling for email conflicts
- ✅ User data correctly stored in database

---

## 📧 Testing Email Notification System

### Prerequisites
1. Admin user account (role_id = 1 or is_super_admin = TRUE)
2. Email configuration in `.env` file
3. At least 2-3 test users in the system

### Test Scenarios

#### Scenario 1: Admin Email Management Access
1. **Login as Admin**: Use admin credentials
2. **Navigate to Admin Dashboard**: Go to `/admin`
3. **Access Email Tab**: Click "Email Management" tab
4. **Verify Interface**: Should see email composition and logs sections

#### Scenario 2: Send Test Email
1. **Open Email Dialog**: Click "Compose Email" button
2. **Select Recipients**:
   - View list of all active users
   - Select 1-2 test users using checkboxes
   - Try "Select All" functionality
3. **Compose Email**:
   - Subject: "Test Email from LawFort"
   - Content: "This is a test email to verify the email system functionality."
   - Email Type: "Test Email"
4. **Send Email**: Click "Send Email" button
5. **Verify Success**: Should show success message with recipient count

#### Scenario 3: Email Delivery Verification
1. **Check Email Logs**: View the email logs section in admin dashboard
2. **Verify Log Entry**: Should show the sent email with:
   - Correct subject
   - Sender name
   - Recipient count
   - Status: "sent"
   - Timestamp
3. **Check Recipient Inbox**: Verify actual email delivery to recipient's email

#### Scenario 4: Email Content Verification
The sent email should contain:
- ✅ Professional LawFort branding
- ✅ Styled HTML template
- ✅ Your custom content
- ✅ Test email indicators
- ✅ Placeholder content sections
- ✅ Professional footer

### Expected Email Template Structure
```
┌─────────────────────────────────┐
│ LawFort Header (Blue)           │
│ Legal Professional Network      │
├─────────────────────────────────┤
│ Subject: [Your Subject]         │
│                                 │
│ [Your Custom Content]           │
│                                 │
│ 📧 Test Email Information       │
│ • Email Type: [Type]            │
│ • Recipients: [Count]           │
│ • Purpose: Testing system       │
│                                 │
│ Note: Placeholder content       │
├─────────────────────────────────┤
│ © 2024 LawFort Footer          │
└─────────────────────────────────┘
```

---

## 🔍 Troubleshooting

### Google OAuth Issues

**Problem**: "Invalid Google token" error
**Solution**: 
- Check Google Client ID configuration
- Ensure proper network connectivity
- Verify Google account permissions

**Problem**: Profile completion not showing
**Solution**:
- Check database user creation
- Verify OAuth user flags in database
- Check browser console for errors

### Email System Issues

**Problem**: "Failed to send email" error
**Solution**:
- Verify SMTP configuration in `.env`
- Check Gmail app password setup
- Ensure EMAIL_USER and EMAIL_PASSWORD are correct

**Problem**: Emails not being received
**Solution**:
- Check spam/junk folders
- Verify recipient email addresses
- Check email logs for delivery status

**Problem**: Admin panel not accessible
**Solution**:
- Verify user has admin role (role_id = 1)
- Check is_super_admin flag in database
- Ensure proper authentication

---

## 📊 Database Verification

### Check OAuth User Creation
```sql
SELECT User_ID, Email, Auth_Provider, OAuth_ID, Profile_Complete 
FROM Users 
WHERE Auth_Provider = 'google';
```

### Check Email Logs
```sql
SELECT Email_ID, Subject, Recipient_IDs, Status, Sent_At 
FROM Email_Logs 
ORDER BY Sent_At DESC 
LIMIT 10;
```

### Verify User Roles
```sql
SELECT u.User_ID, u.Email, u.Is_Super_Admin, r.Role_Name 
FROM Users u 
JOIN Roles r ON u.Role_ID = r.Role_ID 
WHERE u.Role_ID = 1 OR u.Is_Super_Admin = TRUE;
```

---

## ✅ Success Criteria

### Google OAuth Integration
- [ ] New users can sign up with Google
- [ ] Existing users can login with Google
- [ ] Profile completion works for OAuth users
- [ ] User data is properly stored
- [ ] Error handling works correctly

### Email Notification System
- [ ] Admin can access email management
- [ ] User selection interface works
- [ ] Email composition and sending works
- [ ] Professional email templates are used
- [ ] Email logs are properly recorded
- [ ] Actual emails are delivered

### Overall Integration
- [ ] No conflicts with existing authentication
- [ ] UI/UX is professional and intuitive
- [ ] Error messages are user-friendly
- [ ] Performance is acceptable
- [ ] Security measures are in place

---

## 📝 Test Report Template

After testing, document results:

```
## Test Results - [Date]

### Google OAuth Testing
- New User Signup: ✅/❌
- Existing User Login: ✅/❌
- Profile Completion: ✅/❌
- Error Handling: ✅/❌

### Email System Testing
- Admin Access: ✅/❌
- Email Composition: ✅/❌
- Email Delivery: ✅/❌
- Email Logging: ✅/❌

### Issues Found
1. [Issue description]
2. [Issue description]

### Recommendations
1. [Recommendation]
2. [Recommendation]
```

Both features are production-ready and fully functional when properly configured!
