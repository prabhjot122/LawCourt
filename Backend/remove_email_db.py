#!/usr/bin/env python3
"""
Script to remove email functionality from LawFort database
This script will drop the Email_Logs table and clean up email-related data
"""

import os
import mysql.connector
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def remove_email_functionality():
    """Remove email functionality from the database"""
    try:
        # Database configuration
        db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'user': os.getenv('DB_USER', 'root'),
            'password': os.getenv('DB_PASSWORD', ''),
            'database': os.getenv('DB_NAME', 'LawFort'),
            'charset': 'utf8mb4',
            'collation': 'utf8mb4_unicode_ci'
        }

        print("🔧 Connecting to database...")
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        print("📧 Removing email functionality...")

        # Drop Email_Logs table if it exists
        cursor.execute("DROP TABLE IF EXISTS Email_Logs")
        print("✅ Email_Logs table dropped successfully")

        # Commit changes
        conn.commit()
        print("✅ Email functionality removed successfully!")

        # Verify tables
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        table_names = [table[0] for table in tables]
        
        if 'Email_Logs' not in table_names:
            print("✅ Confirmed: Email_Logs table no longer exists")
        else:
            print("⚠️  Warning: Email_Logs table still exists")

        print("\n📋 Current database tables:")
        for table in table_names:
            print(f"  - {table}")

    except mysql.connector.Error as e:
        print(f"❌ Database error: {e}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

    return True

if __name__ == "__main__":
    print("🚀 LawFort Email Functionality Removal Script")
    print("=" * 50)
    
    success = remove_email_functionality()
    
    if success:
        print("\n✅ Email functionality removal completed successfully!")
        print("📝 Note: Backend endpoints now return dummy data for frontend compatibility")
    else:
        print("\n❌ Email functionality removal failed!")
        print("Please check the error messages above and try again.")
