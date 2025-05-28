import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from mysql.connector import pooling
import bcrypt
import uuid
from datetime import datetime
from flask_cors import CORS
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from features_manage import feature_bp
from database import init_db_pool, get_db_connection

# Load environment variables from .env file
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
# Enable CORS for all routes
CORS(app, resources={r"/*": {"origins": "*"}})

# Initialize database on first request
@app.before_request
def initialize_db_pool_on_first_request():
    """Initialize the database connection pool on the first request"""
    global _initialized
    if not _initialized:
        if not init_db_pool():
            print("Failed to initialize database connection pool. The application may not work correctly.")
        _initialized = True

# Global initialization flag
_initialized = False

app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'Sahil@123')

# Google OAuth Configuration
GOOGLE_CLIENT_ID = "517818204697-jpimspqvc3f4folciiapr6vbugs9t7hu.apps.googleusercontent.com"

app.register_blueprint(feature_bp, url_prefix='/api')

# Import feature routes
from features_manage import (
    create_blog_post, get_blog_posts, get_blog_post, update_blog_post,
    delete_blog_post, add_blog_comment, upload_research_paper,
    get_research_papers, get_research_paper, update_research_paper,
    delete_research_paper, create_note, get_notes, get_note, update_note,
    delete_note, create_internship, get_internships, get_internship,
    update_internship, delete_internship, create_learning_module,
    get_learning_modules, get_learning_module, update_learning_module,
    delete_learning_module
)

@app.route('/blog/posts', methods=['POST'])
def create_post():
    data = request.get_json()
    required_fields = ['user_id', 'title', 'content']
    validation_error = validate_required_fields(data, required_fields)
    if validation_error:
        return validation_error
    
    try:
        response, status = create_blog_post(
            user_id=data['user_id'],
            title=data['title'],
            content=data['content'],
            tags=data.get('tags'),
            image_url=data.get('image_url')
        )
        return jsonify(response), status
    except Exception as e:
        return handle_db_error(e, "blog post creation")

@app.route('/blog/posts', methods=['GET'])
def get_posts():
    try:
        response, status = get_blog_posts()
        return jsonify(response), status
    except Exception as e:
        return handle_db_error(e, "blog posts retrieval")

@app.route('/blog/posts/<int:post_id>', methods=['GET'])
def get_post(post_id):
    try:
        response, status = get_blog_post(post_id)
        return jsonify(response), status
    except Exception as e:
        return handle_db_error(e, "blog post retrieval")

@app.route('/blog/posts/<int:post_id>', methods=['PUT'])
def update_post(post_id):
    data = request.get_json()
    required_fields = ['user_id', 'title', 'content']
    validation_error = validate_required_fields(data, required_fields)
    if validation_error:
        return validation_error
    
    try:
        response, status = update_blog_post(
            post_id=post_id,
            user_id=data['user_id'],
            title=data['title'],
            content=data['content'],
            tags=data.get('tags'),
            image_url=data.get('image_url')
        )
        return jsonify(response), status
    except Exception as e:
        return handle_db_error(e, "blog post update")

@app.route('/blog/posts/<int:post_id>', methods=['DELETE'])
def delete_post(post_id):
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400
    
    try:
        response, status = delete_blog_post(post_id, user_id)
        return jsonify(response), status
    except Exception as e:
        return handle_db_error(e, "blog post deletion")

@app.route('/blog/posts/<int:post_id>/comments', methods=['POST'])
def add_comment(post_id):
    data = request.get_json()
    required_fields = ['user_id', 'comment']
    validation_error = validate_required_fields(data, required_fields)
    if validation_error:
        return validation_error
    
    try:
        response, status = add_blog_comment(
            post_id=post_id,
            user_id=data['user_id'],
            comment=data['comment']
        )
        return jsonify(response), status
    except Exception as e:
        return handle_db_error(e, "blog comment addition")

@app.route('/research-papers', methods=['POST'])
def upload_paper():
    data = request.get_json()
    required_fields = ['user_id', 'title', 'content']
    validation_error = validate_required_fields(data, required_fields)
    if validation_error:
        return validation_error
    
    try:
        response, status = upload_research_paper(
            user_id=data['user_id'],
            title=data['title'],
            content=data['content'],
            tags=data.get('tags'),
            file_url=data.get('file_url')
        )
        return jsonify(response), status
    except Exception as e:
        return handle_db_error(e, "research paper upload")

@app.route('/research-papers', methods=['GET'])
def get_papers():
    try:
        response, status = get_research_papers()
        return jsonify(response), status
    except Exception as e:
        return handle_db_error(e, "research papers retrieval")

@app.route('/research-papers/<int:paper_id>', methods=['GET'])
def get_paper(paper_id):
    try:
        response, status = get_research_paper(paper_id)
        return jsonify(response), status
    except Exception as e:
        return handle_db_error(e, "research paper retrieval")

@app.route('/research-papers/<int:paper_id>', methods=['PUT'])
def update_paper(paper_id):
    data = request.get_json()
    required_fields = ['user_id', 'title', 'content']
    validation_error = validate_required_fields(data, required_fields)
    if validation_error:
        return validation_error
    
    try:
        response, status = update_research_paper(
            paper_id=paper_id,
            user_id=data['user_id'],
            title=data['title'],
            content=data['content'],
            tags=data.get('tags'),
            file_url=data.get('file_url')
        )
        return jsonify(response), status
    except Exception as e:
        return handle_db_error(e, "research paper update")

@app.route('/research-papers/<int:paper_id>', methods=['DELETE'])
def delete_paper(paper_id):
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400
    
    try:
        response, status = delete_research_paper(paper_id, user_id)
        return jsonify(response), status
    except Exception as e:
        return handle_db_error(e, "research paper deletion")

@app.route('/notes', methods=['POST'])
def create_note_route():
    data = request.get_json()
    required_fields = ['user_id', 'title', 'content']
    validation_error = validate_required_fields(data, required_fields)
    if validation_error:
        return validation_error
    
    try:
        response, status = create_note(
            user_id=data['user_id'],
            title=data['title'],
            content=data['content'],
            tags=data.get('tags')
        )
        return jsonify(response), status
    except Exception as e:
        return handle_db_error(e, "note creation")

@app.route('/notes', methods=['GET'])
def get_notes_route():
    try:
        response, status = get_notes()
        return jsonify(response), status
    except Exception as e:
        return handle_db_error(e, "notes retrieval")

@app.route('/notes/<int:note_id>', methods=['GET'])
def get_note_route(note_id):
    try:
        response, status = get_note(note_id)
        return jsonify(response), status
    except Exception as e:
        return handle_db_error(e, "note retrieval")

@app.route('/notes/<int:note_id>', methods=['PUT'])
def update_note_route(note_id):
    data = request.get_json()
    required_fields = ['user_id', 'title', 'content']
    validation_error = validate_required_fields(data, required_fields)
    if validation_error:
        return validation_error
    
    try:
        response, status = update_note(
            note_id=note_id,
            user_id=data['user_id'],
            title=data['title'],
            content=data['content'],
            tags=data.get('tags')
        )
        return jsonify(response), status
    except Exception as e:
        return handle_db_error(e, "note update")

@app.route('/notes/<int:note_id>', methods=['DELETE'])
def delete_note_route(note_id):
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400
    
    try:
        response, status = delete_note(note_id, user_id)
        return jsonify(response), status
    except Exception as e:
        return handle_db_error(e, "note deletion")

@app.route('/internships', methods=['POST'])
def create_internship_route():
    data = request.get_json()
    required_fields = ['user_id', 'title', 'description']
    validation_error = validate_required_fields(data, required_fields)
    if validation_error:
        return validation_error
    
    try:
        response, status = create_internship(
            user_id=data['user_id'],
            title=data['title'],
            description=data['description'],
            tags=data.get('tags'),
            application_url=data.get('application_url')
        )
        return jsonify(response), status
    except Exception as e:
        return handle_db_error(e, "internship creation")

@app.route('/internships', methods=['GET'])
def get_internships_route():
    try:
        response, status = get_internships()
        return jsonify(response), status
    except Exception as e:
        return handle_db_error(e, "internships retrieval")

@app.route('/internships/<int:internship_id>', methods=['GET'])
def get_internship_route(internship_id):
    try:
        response, status = get_internship(internship_id)
        return jsonify(response), status
    except Exception as e:
        return handle_db_error(e, "internship retrieval")

@app.route('/internships/<int:internship_id>', methods=['PUT'])
def update_internship_route(internship_id):
    data = request.get_json()
    required_fields = ['user_id', 'title', 'description']
    validation_error = validate_required_fields(data, required_fields)
    if validation_error:
        return validation_error
    
    try:
        response, status = update_internship(
            internship_id=internship_id,
            user_id=data['user_id'],
            title=data['title'],
            description=data['description'],
            tags=data.get('tags'),
            application_url=data.get('application_url')
        )
        return jsonify(response), status
    except Exception as e:
        return handle_db_error(e, "internship update")

@app.route('/internships/<int:internship_id>', methods=['DELETE'])
def delete_internship_route(internship_id):
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400
    
    try:
        response, status = delete_internship(internship_id, user_id)
        return jsonify(response), status
    except Exception as e:
        return handle_db_error(e, "internship deletion")

@app.route('/learning-modules', methods=['POST'])
def create_learning_module_route():
    data = request.get_json()
    required_fields = ['user_id', 'title', 'content']
    validation_error = validate_required_fields(data, required_fields)
    if validation_error:
        return validation_error
    
    try:
        response, status = create_learning_module(
            user_id=data['user_id'],
            title=data['title'],
            content=data['content'],
            tags=data.get('tags'),
            video_url=data.get('video_url')
        )
        return jsonify(response), status
    except Exception as e:
        return handle_db_error(e, "learning module creation")

@app.route('/learning-modules', methods=['GET'])
def get_learning_modules_route():
    try:
        response, status = get_learning_modules()
        return jsonify(response), status
    except Exception as e:
        return handle_db_error(e, "learning modules retrieval")

@app.route('/learning-modules/<int:module_id>', methods=['GET'])
def get_learning_module_route(module_id):
    try:
        response, status = get_learning_module(module_id)
        return jsonify(response), status
    except Exception as e:
        return handle_db_error(e, "learning module retrieval")

@app.route('/learning-modules/<int:module_id>', methods=['PUT'])
def update_learning_module_route(module_id):
    data = request.get_json()
    required_fields = ['user_id', 'title', 'content']
    validation_error = validate_required_fields(data, required_fields)
    if validation_error:
        return validation_error
    
    try:
        response, status = update_learning_module(
            module_id=module_id,
            user_id=data['user_id'],
            title=data['title'],
            content=data['content'],
            tags=data.get('tags'),
            video_url=data.get('video_url')
        )
        return jsonify(response), status
    except Exception as e:
        return handle_db_error(e, "learning module update")

@app.route('/learning-modules/<int:module_id>', methods=['DELETE'])
def delete_learning_module_route(module_id):
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400
    
    try:
        response, status = delete_learning_module(module_id, user_id)
        return jsonify(response), status
    except Exception as e:
        return handle_db_error(e, "learning module deletion")

def validate_required_fields(data, required_fields):
    """Validate that all required fields are present in the data"""
    missing_fields = [field for field in required_fields if field not in data]
    if missing_fields:
        return jsonify({"error": f"Missing required fields: {', '.join(missing_fields)}"}), 400

def handle_db_error(e, operation):
    """Handle database errors"""
    print(f"Error during {operation}: {e}")
    return jsonify({"error": "An error occurred while processing your request"}), 500

if __name__ == '__main__':
    app.run(debug=True)
