import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, Eye, Loader2 } from 'lucide-react';
import { contentApi, BlogPost as BlogPostType } from '@/services/api';

const CreateEditBlogPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    category: '',
    tags: '',
    featured_image: '',
    allow_comments: true,
    is_published: true,  // Default to published for better UX
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);

  const categories = [
    'Constitutional Law',
    'Corporate Law',
    'Employment Law',
    'Intellectual Property',
    'Criminal Law',
    'Family Law',
    'General',
  ];

  // Load existing blog post if editing
  useEffect(() => {
    if (isEditing && id) {
      const fetchBlogPost = async () => {
        try {
          setInitialLoading(true);
          const response = await contentApi.getBlogPost(parseInt(id));
          const post = response.blog_post;

          setFormData({
            title: post.title,
            summary: post.summary || '',
            content: post.content,
            category: post.category || '',
            tags: post.tags || '',
            featured_image: post.featured_image || '',
            allow_comments: post.allow_comments,
            is_published: post.is_published,
          });
        } catch (err) {
          console.error('Error fetching blog post:', err);
          toast({
            title: "Error",
            description: "Failed to load blog post for editing.",
            variant: "destructive",
          });
          navigate('/blogs');
        } finally {
          setInitialLoading(false);
        }
      };

      fetchBlogPost();
    }
  }, [id, isEditing, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Validation Error",
        description: "Title and content are required.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      const submitData = {
        title: formData.title.trim(),
        summary: formData.summary.trim(),
        content: formData.content.trim(),
        category: formData.category,
        tags: formData.tags.trim(),
        featured_image: formData.featured_image.trim(),
        allow_comments: formData.allow_comments,
        is_published: formData.is_published,
      };

      if (isEditing && id) {
        await contentApi.updateBlogPost(parseInt(id), submitData);
        toast({
          title: "Success",
          description: "Blog post updated successfully.",
        });
      } else {
        const response = await contentApi.createBlogPost(submitData);
        toast({
          title: "Success",
          description: "Blog post created successfully.",
        });
        navigate(`/blogs/${response.content_id}`);
        return;
      }

      navigate('/blogs');
    } catch (err) {
      console.error('Error saving blog post:', err);
      toast({
        title: "Error",
        description: "Failed to save blog post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Title is required to save as draft.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      const draftData = {
        ...formData,
        title: formData.title.trim(),
        summary: formData.summary.trim(),
        content: formData.content.trim(),
        tags: formData.tags.trim(),
        featured_image: formData.featured_image.trim(),
        is_published: false,
      };

      if (isEditing && id) {
        await contentApi.updateBlogPost(parseInt(id), draftData);
        toast({
          title: "Draft Saved",
          description: "Blog post saved as draft.",
        });
      } else {
        const response = await contentApi.createBlogPost(draftData);
        toast({
          title: "Draft Saved",
          description: "Blog post saved as draft.",
        });
        navigate(`/blogs/${response.content_id}/edit`);
        return;
      }
    } catch (err) {
      console.error('Error saving draft:', err);
      toast({
        title: "Error",
        description: "Failed to save draft. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" asChild>
          <Link to="/blogs" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Blog Posts
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-10 bg-gray-200 rounded animate-pulse" />
              <div className="h-20 bg-gray-200 rounded animate-pulse" />
              <div className="h-40 bg-gray-200 rounded animate-pulse" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link to="/blogs" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Blog Posts
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={saving || !formData.title.trim()}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Draft
          </Button>
          <Button variant="outline" disabled>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {isEditing ? 'Edit Blog Post' : 'Create New Blog Post'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter blog post title..."
                required
              />
            </div>

            {/* Summary */}
            <div className="space-y-2">
              <Label htmlFor="summary">Summary</Label>
              <Textarea
                id="summary"
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                placeholder="Brief summary of the blog post..."
                rows={3}
              />
            </div>

            {/* Category and Tags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="Enter tags separated by commas..."
                />
              </div>
            </div>

            {/* Featured Image */}
            <div className="space-y-2">
              <Label htmlFor="featured_image">Featured Image URL</Label>
              <Input
                id="featured_image"
                value={formData.featured_image}
                onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })}
                placeholder="Enter image URL..."
              />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write your blog post content here..."
                rows={15}
                className="font-mono"
                required
              />
              <p className="text-sm text-gray-500">
                You can use HTML tags for formatting.
              </p>
            </div>

            {/* Settings */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allow_comments"
                  checked={formData.allow_comments}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, allow_comments: checked as boolean })
                  }
                />
                <Label htmlFor="allow_comments">Allow comments</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_published: checked as boolean })
                  }
                />
                <Label htmlFor="is_published">Publish immediately</Label>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/blogs')}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving || !formData.title.trim() || !formData.content.trim()}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  isEditing ? 'Update Post' : 'Create Post'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateEditBlogPost;
