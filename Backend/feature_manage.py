
from flask import Blueprint, jsonify, request
import mysql.connector
from mysql.connector import pooling
import os
from datetime import datetime
import uuid
import json
from database import get_db_connection, init_db_pool

# Initialize the blueprint
feature_bp = Blueprint('features', __name__)

# ==================== BLOG POST FUNCTIONS ====================

# ==================== RESEARCH PAPER FUNCTIONS ====================

# ==================== NOTES FUNCTIONS ====================

# ==================== INTERNSHIP & JOB FUNCTIONS ====================

# ==================== COURSE & LEARNING FUNCTIONS ====================

# ==================== QUIZ FUNCTIONS ====================

# Error handling functions
def handle_db_error(e, operation="database operation"):
    """Handle database errors consistently"""
    error_msg = f"Error during {operation}: {str(e)}"
    print(error_msg)
    return jsonify({"error": error_msg}), 500

def validate_required_fields(data, required_fields):
    """Validate that all required fields are present in the request data"""
    missing_fields = [field for field in required_fields if field not in data or data[field] is None]
    if missing_fields:
        return jsonify({"error": f"Missing required fields: {', '.join(missing_fields)}"}), 400
    return None

# Initialize connection pool when module is imported
connection_pool = None
