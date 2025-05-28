
import os
from mysql.connector import pooling
import mysql.connector
from flask import jsonify
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class DatabasePool:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DatabasePool, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        
        try:
            # MySQL Connection Pool Configuration
            db_config = {
                'host': os.getenv('DB_HOST', 'localhost'),
                'user': os.getenv('DB_USER', 'root'),
                'password': os.getenv('DB_PASSWORD', 'Sahil@123'),
                'database': os.getenv('DB_NAME', 'lawfort'),
                'pool_name': 'lawfortdb_pool',
                'pool_size': int(os.getenv('DB_POOL_SIZE', 5)),
                'auth_plugin': 'mysql_native_password',
                'charset': 'utf8mb4',
                'collation': 'utf8mb4_unicode_ci'
            }
            
            self.connection_pool = pooling.MySQLConnectionPool(**db_config)
            logger.info(f"Database connection pool initialized with size {db_config['pool_size']}")
        except Exception as e:
            logger.error(f"Error initializing database connection pool: {e}")
            self.connection_pool = None
        
        self._initialized = True
    
    def get_connection(self):
        """Get a connection from the pool"""
        try:
            if self.connection_pool is None:
                raise Exception("Database connection pool not initialized")
            
            return self.connection_pool.get_connection()
        except Exception as e:
            logger.error(f"Error getting database connection: {e}")
            raise

# Create a global instance
_db_pool = None

def init_db_pool():
    """Initialize or re-initialize the database connection pool"""
    global _db_pool
    _db_pool = DatabasePool()
    return _db_pool.connection_pool is not None if _db_pool else False

def get_db_connection():
    """Get a database connection from the pool"""
    global _db_pool
    if not _db_pool or _db_pool.connection_pool is None:
        if not init_db_pool():
            raise Exception("Database connection pool not available")
    
    return _db_pool.get_connection()