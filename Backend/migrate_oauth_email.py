"""
Migration script to add OAuth and Email functionality to existing LawFort database
Run this script to update your existing database with the new features

Usage: python migrate_oauth_email.py
"""

import mysql.connector
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def migrate_database():
    """Add OAuth and Email functionality to existing database"""

    # Database configuration
    db_config = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'user': os.getenv('DB_USER', 'root'),
        'password': os.getenv('DB_PASSWORD', 'pabbo@123'),
        'database': os.getenv('DB_NAME', 'LawFort'),
        'autocommit': True
    }

    try:
        # Connect to database
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        print("🔗 Connected to database successfully!")

        # Check if OAuth columns exist in Users table
        cursor.execute("DESCRIBE Users")
        columns = [row[0] for row in cursor.fetchall()]

        # Add OAuth columns if they don't exist
        if 'Auth_Provider' not in columns:
            print("➕ Adding Auth_Provider column...")
            cursor.execute("ALTER TABLE Users ADD COLUMN Auth_Provider VARCHAR(20) DEFAULT 'local'")

        if 'OAuth_ID' not in columns:
            print("➕ Adding OAuth_ID column...")
            cursor.execute("ALTER TABLE Users ADD COLUMN OAuth_ID VARCHAR(255)")

        if 'Profile_Complete' not in columns:
            print("➕ Adding Profile_Complete column...")
            cursor.execute("ALTER TABLE Users ADD COLUMN Profile_Complete BOOLEAN DEFAULT TRUE")

        # Add unique constraint for OAuth if it doesn't exist
        try:
            cursor.execute("ALTER TABLE Users ADD CONSTRAINT unique_oauth UNIQUE (Auth_Provider, OAuth_ID)")
            print("🔒 Added unique OAuth constraint")
        except mysql.connector.Error as e:
            if "Duplicate key name" not in str(e):
                print(f"⚠️  OAuth constraint already exists or error: {e}")

        # Create OAuth_Providers table
        cursor.execute("""
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
            )
        """)
        print("📋 OAuth_Providers table created/verified")

        # Email functionality removed - no longer creating Email_Logs table
        print("📧 Email functionality removed from database")

        # Update existing users to have Profile_Complete = TRUE
        cursor.execute("UPDATE Users SET Profile_Complete = TRUE WHERE Auth_Provider = 'local' OR Auth_Provider IS NULL")
        affected_rows = cursor.rowcount
        print(f"✅ Updated {affected_rows} existing users with Profile_Complete = TRUE")

        # Verify tables exist
        cursor.execute("SHOW TABLES")
        tables = [row[0] for row in cursor.fetchall()]

        required_tables = ['Users', 'OAuth_Providers', 'Email_Logs']
        existing_tables = [table for table in required_tables if table in tables]

        print(f"\n📊 Database Status:")
        print(f"   ✅ Required tables present: {existing_tables}")

        # Show Users table structure
        cursor.execute("DESCRIBE Users")
        user_columns = [row[0] for row in cursor.fetchall()]
        oauth_columns = ['Auth_Provider', 'OAuth_ID', 'Profile_Complete']
        oauth_present = [col for col in oauth_columns if col in user_columns]

        print(f"   ✅ OAuth columns in Users table: {oauth_present}")

        print("\n🎉 Migration completed successfully!")
        print("\n📋 Next steps:")
        print("   1. Configure your .env file with email settings:")
        print("      EMAIL_USER=your_email@gmail.com")
        print("      EMAIL_PASSWORD=your_app_password")
        print("   2. Restart the Flask backend: python app.py")
        print("   3. Test Google OAuth and email features")

    except mysql.connector.Error as e:
        print(f"❌ Database error: {e}")
        print("\n🔧 Troubleshooting:")
        print("   1. Check your database connection settings in .env")
        print("   2. Ensure MySQL is running")
        print("   3. Verify database exists and user has proper permissions")
        print("   4. Make sure you're running this from the Backend directory")

    except Exception as e:
        print(f"❌ Unexpected error: {e}")

    finally:
        if 'conn' in locals() and conn.is_connected():
            cursor.close()
            conn.close()
            print("🔌 Database connection closed")

if __name__ == "__main__":
    print("🚀 Migrating LawFort database for OAuth and Email features...")
    print("=" * 60)
    migrate_database()
