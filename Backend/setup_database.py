#!/usr/bin/env python3
"""
Database setup script for LawFort application.
This script will create the database, tables, and insert initial data.
"""

import os
import mysql.connector
from mysql.connector import Error
import bcrypt
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def hash_password(password):
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

def setup_database():
    """Set up the database with tables and initial data"""
    
    # Database configuration
    db_config = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'user': os.getenv('DB_USER', 'root'),
        'password': os.getenv('DB_PASSWORD', 'pabbo@123'),
    }
    
    try:
        # Connect to MySQL server (without specifying database)
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor()
        
        print("Connected to MySQL server successfully!")
        
        # Create database
        cursor.execute("CREATE DATABASE IF NOT EXISTS lawfort")
        cursor.execute("USE lawfort")
        print("Database 'lawfort' created/selected successfully!")
        
        # Create Roles table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS Roles (
                Role_ID INT AUTO_INCREMENT PRIMARY KEY,
                Role_Name VARCHAR(50) NOT NULL,
                Description TEXT
            )
        """)
        print("Roles table created successfully!")
        
        # Insert default roles
        cursor.execute("""
            INSERT IGNORE INTO Roles (Role_ID, Role_Name, Description) VALUES 
            (1, 'Admin', 'System Administrator with full access'),
            (2, 'Editor', 'Content Editor with content management access'),
            (3, 'User', 'Regular User with standard access')
        """)
        print("Default roles inserted successfully!")
        
        # Create Users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS Users (
                User_ID INT AUTO_INCREMENT PRIMARY KEY,
                Email VARCHAR(100) NOT NULL UNIQUE,
                Password VARCHAR(255) NOT NULL,
                Role_ID INT,
                Is_Super_Admin BOOLEAN DEFAULT FALSE,
                Status VARCHAR(20) DEFAULT 'Active',
                Created_At DATETIME DEFAULT CURRENT_TIMESTAMP,
                Updated_At DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (Role_ID) REFERENCES Roles(Role_ID)
            )
        """)
        print("Users table created successfully!")
        
        # Create User_Profile table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS User_Profile (
                Profile_ID INT AUTO_INCREMENT PRIMARY KEY,
                User_ID INT,
                Full_Name VARCHAR(255),
                Phone VARCHAR(15),
                Bio TEXT,
                Profile_Pic VARCHAR(255),
                Law_Specialization VARCHAR(100),
                Education VARCHAR(255),
                Bar_Exam_Status ENUM('Passed', 'Pending', 'Not Applicable'),
                License_Number VARCHAR(100),
                Practice_Area VARCHAR(255),
                Location VARCHAR(255),
                Years_of_Experience INT,
                LinkedIn_Profile VARCHAR(255),
                Alumni_of VARCHAR(255),
                Professional_Organizations TEXT,
                FOREIGN KEY (User_ID) REFERENCES Users(User_ID)
            )
        """)
        print("User_Profile table created successfully!")
        
        # Create Access_Request table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS Access_Request (
                Request_ID INT AUTO_INCREMENT PRIMARY KEY,
                User_ID INT,
                Requested_At DATETIME DEFAULT CURRENT_TIMESTAMP,
                Status ENUM('Pending', 'Approved', 'Denied') DEFAULT 'Pending',
                Approved_At DATETIME,
                Denied_At DATETIME,
                Admin_ID INT,
                FOREIGN KEY (User_ID) REFERENCES Users(User_ID),
                FOREIGN KEY (Admin_ID) REFERENCES Users(User_ID)
            )
        """)
        print("Access_Request table created successfully!")
        
        # Create Session table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS Session (
                Session_ID INT AUTO_INCREMENT PRIMARY KEY,
                User_ID INT,
                Session_Token VARCHAR(255),
                Last_Active_Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (User_ID) REFERENCES Users(User_ID)
            )
        """)
        print("Session table created successfully!")
        
        # Create Audit_Logs table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS Audit_Logs (
                Log_ID INT AUTO_INCREMENT PRIMARY KEY,
                Admin_ID INT,
                Action_Type VARCHAR(255),
                Action_Details TEXT,
                Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (Admin_ID) REFERENCES Users(User_ID)
            )
        """)
        print("Audit_Logs table created successfully!")
        
        # Insert sample admin user
        admin_password = hash_password('admin123')
        cursor.execute("""
            INSERT INTO Users (Email, Password, Role_ID, Is_Super_Admin, Status) VALUES 
            ('admin@lawfort.com', %s, 1, TRUE, 'Active')
            ON DUPLICATE KEY UPDATE 
            Password = VALUES(Password),
            Role_ID = VALUES(Role_ID),
            Is_Super_Admin = VALUES(Is_Super_Admin),
            Status = VALUES(Status)
        """, (admin_password,))

        # Get admin user ID
        cursor.execute("SELECT User_ID FROM Users WHERE Email = 'admin@lawfort.com'")
        admin_result = cursor.fetchone()
        if admin_result:
            admin_user_id = admin_result[0]
            
            # Insert admin profile
            cursor.execute("""
                INSERT INTO User_Profile (User_ID, Full_Name, Phone, Bio, Profile_Pic, Law_Specialization, 
                                    Education, Bar_Exam_Status, License_Number, Practice_Area, Location, 
                                    Years_of_Experience, LinkedIn_Profile, Alumni_of, Professional_Organizations)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                Full_Name = VALUES(Full_Name),
                Phone = VALUES(Phone),
                Bio = VALUES(Bio)
            """, (admin_user_id, 'System Administrator', '+1-555-0123', 
                  'System administrator with full access to all platform features', 
                  '', 'Legal Technology & Administration', 'J.D.', 'Passed', 'ADMIN001', 
                  'System Administration', 'New York, NY', 5, '', '', 'American Bar Association'))
            print("Admin user created/updated successfully!")
        
        # Insert sample editor user
        editor_password = hash_password('editor123')
        cursor.execute("""
            INSERT IGNORE INTO Users (Email, Password, Role_ID, Status) VALUES 
            ('editor@lawfort.com', %s, 2, 'Active')
        """, (editor_password,))
        
        # Get editor user ID
        cursor.execute("SELECT User_ID FROM Users WHERE Email = 'editor@lawfort.com'")
        editor_result = cursor.fetchone()
        if editor_result:
            editor_user_id = editor_result[0]
            
            # Insert editor profile
            cursor.execute("""
                INSERT IGNORE INTO User_Profile (User_ID, Full_Name, Phone, Bio, Profile_Pic, Law_Specialization, 
                                Education, Bar_Exam_Status, License_Number, Practice_Area, Location, 
                                Years_of_Experience, LinkedIn_Profile, Alumni_of, Professional_Organizations)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (editor_user_id, 'Content Editor', '+1-555-0124', 
                  'Content editor specializing in legal publications and research materials', 
                  '', 'Legal Publishing', 'J.D., Yale Law School', 'Passed', 'EDIT001', 
                  'Content Management', 'Boston, MA', 7, 'https://linkedin.com/in/editor', 
                  'Yale Law School, Class of 2017', 'American Bar Association, Legal Writers Association'))
            print("Sample editor user created successfully!")
        
        # Commit all changes
        connection.commit()
        print("\n✅ Database setup completed successfully!")
        print("\n📋 Test Accounts Created:")
        print("👤 Admin: admin@lawfort.com / admin123")
        print("✏️  Editor: editor@lawfort.com / editor123")
        print("\n🚀 You can now start the Flask application!")
        
    except Error as e:
        print(f"❌ Error setting up database: {e}")
        if connection:
            connection.rollback()
    
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()
            print("MySQL connection closed.")

if __name__ == "__main__":
    print("🔧 Setting up LawFort database...")
    setup_database()

