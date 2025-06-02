#!/usr/bin/env python3
"""
Migration script to add Content_Likes table for the like system functionality.
This script creates the necessary table and triggers for tracking user likes on content.
"""

import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def run_migration():
    """Run the Content_Likes table migration"""
    print("🚀 Running Content_Likes table migration...")
    
    try:
        # Database connection configuration
        connection = mysql.connector.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            database=os.getenv('DB_NAME', 'lawfort'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', 'pabbo@123'),
            autocommit=False
        )
        
        if connection.is_connected():
            cursor = connection.cursor()
            print("✅ Connected to MySQL database")
            
            # Read and execute the migration SQL file
            with open('add_content_likes_table.sql', 'r', encoding='utf-8') as file:
                sql_content = file.read()
            
            # Split the SQL content by statements (handle DELIMITER changes)
            statements = []
            current_statement = ""
            delimiter = ";"
            
            for line in sql_content.split('\n'):
                line = line.strip()
                
                # Skip empty lines and comments
                if not line or line.startswith('--'):
                    continue
                
                # Handle DELIMITER changes
                if line.startswith('DELIMITER'):
                    delimiter = line.split()[1]
                    continue
                
                current_statement += line + "\n"
                
                # Check if statement is complete
                if line.endswith(delimiter):
                    # Remove the delimiter from the end
                    if delimiter != ";":
                        current_statement = current_statement.rstrip(delimiter + "\n")
                    statements.append(current_statement.strip())
                    current_statement = ""
            
            # Add any remaining statement
            if current_statement.strip():
                statements.append(current_statement.strip())
            
            # Execute each statement
            for i, statement in enumerate(statements):
                if statement:
                    try:
                        print(f"📝 Executing statement {i + 1}/{len(statements)}...")
                        cursor.execute(statement)
                        
                        # Fetch results if any
                        if cursor.description:
                            results = cursor.fetchall()
                            for result in results:
                                print(f"   {result}")
                        
                    except Error as e:
                        print(f"⚠️  Warning in statement {i + 1}: {e}")
                        # Continue with other statements
                        continue
            
            # Commit all changes
            connection.commit()
            print("✅ Migration completed successfully!")
            
            # Verify the table was created
            cursor.execute("SHOW TABLES LIKE 'Content_Likes'")
            if cursor.fetchone():
                print("✅ Content_Likes table created successfully!")
                
                # Show table structure
                cursor.execute("DESCRIBE Content_Likes")
                columns = cursor.fetchall()
                print("\n📋 Content_Likes table structure:")
                for column in columns:
                    print(f"   {column[0]} - {column[1]} {column[2] if column[2] else ''}")
                
                # Check if triggers were created
                cursor.execute("SHOW TRIGGERS LIKE 'update_likes_on_%'")
                triggers = cursor.fetchall()
                print(f"\n🔧 Created {len(triggers)} triggers for automatic like counting")
                
            else:
                print("❌ Content_Likes table was not created")
            
    except Error as e:
        print(f"❌ Database error: {e}")
        if connection:
            connection.rollback()
    
    except FileNotFoundError:
        print("❌ Migration file 'add_content_likes_table.sql' not found")
    
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        if connection:
            connection.rollback()
    
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()
            print("🔌 Database connection closed")

if __name__ == "__main__":
    run_migration()
