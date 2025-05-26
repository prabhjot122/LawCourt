#!/usr/bin/env python3
"""
LawFort Admin User Creation Utility

This script allows you to create a new admin user or update the default admin password.
It uses the same bcrypt hashing method as the main application.

Usage:
    python create_admin.py

The script will prompt you for:
- Email address
- Password
- Full name
- Other profile details

The generated SQL can be executed directly in your MySQL database.
"""

import bcrypt
import getpass
import sys

def hash_password(password):
    """Hash a password using bcrypt (same method as app.py)"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

def get_user_input():
    """Get user input for admin account creation"""
    print("=== LawFort Admin User Creation ===\n")
    
    email = input("Enter admin email: ").strip()
    if not email:
        print("Email is required!")
        return None
    
    password = getpass.getpass("Enter admin password: ").strip()
    if not password:
        print("Password is required!")
        return None
    
    confirm_password = getpass.getpass("Confirm admin password: ").strip()
    if password != confirm_password:
        print("Passwords do not match!")
        return None
    
    full_name = input("Enter full name (default: System Administrator): ").strip()
    if not full_name:
        full_name = "System Administrator"
    
    phone = input("Enter phone number (default: +1-555-0123): ").strip()
    if not phone:
        phone = "+1-555-0123"
    
    return {
        'email': email,
        'password': password,
        'full_name': full_name,
        'phone': phone
    }

def generate_sql(user_data):
    """Generate SQL statements for creating the admin user"""
    hashed_password = hash_password(user_data['password'])
    
    # Convert bytes to string for SQL
    if isinstance(hashed_password, bytes):
        hashed_password = hashed_password.decode('utf-8')
    
    sql = f"""
-- Generated Admin User SQL
-- Email: {user_data['email']}
-- Generated on: $(date)

-- Insert admin user
INSERT INTO Users (Email, Password, Role_ID, Is_Super_Admin, Status) VALUES
('{user_data['email']}', '{hashed_password}', 1, TRUE, 'Active');

-- Get the admin user ID and insert profile
SET @admin_user_id = LAST_INSERT_ID();

INSERT INTO User_Profile (User_ID, Full_Name, Phone, Bio, Profile_Pic, Law_Specialization,
                        Education, Bar_Exam_Status, License_Number, Practice_Area, Location,
                        Years_of_Experience, LinkedIn_Profile, Alumni_of, Professional_Organizations)
VALUES (@admin_user_id, '{user_data['full_name']}', '{user_data['phone']}',
        'Administrator account with full system access',
        '', 'Legal Technology & Administration', 'J.D.', 'Passed', 'ADMIN001',
        'System Administration', 'New York, NY', 5, '', '', 'American Bar Association');
"""
    
    return sql

def main():
    """Main function"""
    try:
        user_data = get_user_input()
        if not user_data:
            sys.exit(1)
        
        print("\n=== Generated SQL ===")
        sql = generate_sql(user_data)
        print(sql)
        
        print("\n=== Instructions ===")
        print("1. Copy the SQL above")
        print("2. Connect to your MySQL database")
        print("3. Execute the SQL statements")
        print("4. The admin user will be created with the specified credentials")
        print("\nIMPORTANT: Keep these credentials secure!")
        
    except KeyboardInterrupt:
        print("\n\nOperation cancelled.")
        sys.exit(1)
    except Exception as e:
        print(f"\nError: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
