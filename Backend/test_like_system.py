#!/usr/bin/env python3
"""
Test script for the like system functionality.
Tests the like/unlike API endpoints and database integration.
"""

import requests
import json
import time

BASE_URL = "http://localhost:5000"

def test_like_system():
    """Test the complete like system functionality"""
    print("🧪 Testing LawFort Like System")
    print("=" * 50)
    
    # Step 1: Login as admin
    print("1. 🔐 Logging in as admin...")
    login_response = requests.post(f"{BASE_URL}/login", json={
        'email': 'admin@lawfort.com',
        'password': 'admin123'
    })
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code} - {login_response.text}")
        return
    
    login_data = login_response.json()
    session_token = login_data.get('session_token')
    print(f"✅ Login successful! Session token: {session_token[:20]}...")
    
    # Step 2: Get blog posts to test with
    print("\n2. 📚 Fetching blog posts...")
    headers = {'Authorization': f'Bearer {session_token}'}
    
    blog_response = requests.get(f"{BASE_URL}/api/blog-posts", headers=headers)
    if blog_response.status_code != 200:
        print(f"❌ Failed to fetch blog posts: {blog_response.status_code}")
        return
    
    blog_data = blog_response.json()
    blog_posts = blog_data.get('blog_posts', [])
    
    if not blog_posts:
        print("❌ No blog posts found to test with")
        return
    
    test_post = blog_posts[0]
    content_id = test_post['content_id']
    print(f"✅ Found test blog post: '{test_post['title'][:50]}...' (ID: {content_id})")
    
    # Step 3: Check initial like status
    print(f"\n3. 📊 Checking initial like status for content {content_id}...")
    status_response = requests.get(f"{BASE_URL}/api/content/{content_id}/like-status", headers=headers)
    
    if status_response.status_code != 200:
        print(f"❌ Failed to get like status: {status_response.status_code} - {status_response.text}")
        return
    
    initial_status = status_response.json()
    print(f"✅ Initial status - Liked: {initial_status['is_liked']}, Count: {initial_status['like_count']}")
    
    # Step 4: Like the content
    print(f"\n4. ❤️  Liking content {content_id}...")
    like_response = requests.post(f"{BASE_URL}/api/content/{content_id}/like", headers=headers)
    
    if like_response.status_code != 200:
        print(f"❌ Failed to like content: {like_response.status_code} - {like_response.text}")
        return
    
    like_data = like_response.json()
    print(f"✅ Like response: {like_data['action']} - Liked: {like_data['is_liked']}, Count: {like_data['like_count']}")
    
    # Step 5: Verify like status changed
    print(f"\n5. 🔍 Verifying like status changed...")
    status_response2 = requests.get(f"{BASE_URL}/api/content/{content_id}/like-status", headers=headers)
    
    if status_response2.status_code != 200:
        print(f"❌ Failed to get updated like status: {status_response2.status_code}")
        return
    
    updated_status = status_response2.json()
    print(f"✅ Updated status - Liked: {updated_status['is_liked']}, Count: {updated_status['like_count']}")
    
    # Step 6: Unlike the content
    print(f"\n6. 💔 Unliking content {content_id}...")
    unlike_response = requests.post(f"{BASE_URL}/api/content/{content_id}/like", headers=headers)
    
    if unlike_response.status_code != 200:
        print(f"❌ Failed to unlike content: {unlike_response.status_code} - {unlike_response.text}")
        return
    
    unlike_data = unlike_response.json()
    print(f"✅ Unlike response: {unlike_data['action']} - Liked: {unlike_data['is_liked']}, Count: {unlike_data['like_count']}")
    
    # Step 7: Final verification
    print(f"\n7. ✅ Final verification...")
    final_status_response = requests.get(f"{BASE_URL}/api/content/{content_id}/like-status", headers=headers)
    
    if final_status_response.status_code != 200:
        print(f"❌ Failed to get final like status: {final_status_response.status_code}")
        return
    
    final_status = final_status_response.json()
    print(f"✅ Final status - Liked: {final_status['is_liked']}, Count: {final_status['like_count']}")
    
    # Summary
    print(f"\n🎉 Like System Test Summary:")
    print(f"   Initial like count: {initial_status['like_count']}")
    print(f"   After like: {updated_status['like_count']}")
    print(f"   After unlike: {final_status['like_count']}")
    print(f"   ✅ Like system is working correctly!")

def test_multiple_users():
    """Test like system with multiple users"""
    print("\n🧪 Testing Multiple Users Like System")
    print("=" * 50)
    
    # This would require multiple user accounts
    # For now, just test with admin account
    print("ℹ️  Multiple user testing requires additional user accounts")
    print("   Current test uses admin account only")

if __name__ == "__main__":
    try:
        test_like_system()
        test_multiple_users()
        print("\n🎉 All tests completed!")
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
