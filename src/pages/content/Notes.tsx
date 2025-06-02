import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, BookOpen, User, Calendar, Eye, Heart, Save, Edit, Lock, Globe, Copy, Star, Trash2, TrendingUp, ArrowRight, Bookmark, Filter, FileText, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { contentApi, userApi, Note } from '@/services/api';
import { useAuth, UserRole, Permission } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const Notes = () => {
  const [publicNotes, setPublicNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [authorFilter, setAuthorFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'saved'>('recent');
  const { toast } = useToast();
  const { user, hasPermission } = useAuth();

  const canCreateContent = user?.role === UserRole.ADMIN || user?.role === UserRole.EDITOR;
  const canSaveContent = hasPermission(Permission.CONTENT_SAVE);

  const categories = [
    'Study Notes',
    'Practice Notes',
    'Research',
    'Case Notes',
    'Meeting Notes',
    'General'
  ];

  useEffect(() => {
    fetchPublicNotes();
  }, [selectedCategory, authorFilter, dateFrom, sortBy, searchTerm]);

  const fetchPublicNotes = async () => {
    try {
      setLoading(true);
      const response = await contentApi.getNotes({
        search: searchTerm || undefined,
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        author: authorFilter || undefined,
        date_from: dateFrom || undefined,

        sort_by: sortBy,
        limit: 20
      });
      setPublicNotes(response.notes);
    } catch (error) {
      console.error('Error fetching public notes:', error);
      toast({
        title: "Error",
        description: "Failed to load public notes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async (note: Note) => {
    try {
      await userApi.saveContent({ content_id: note.content_id, notes: `Saved note: ${note.title}` });
      toast({
        title: "Success",
        description: "Note saved to your personal library successfully!",
      });
      // Refresh public notes to update save counts
      fetchPublicNotes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save note. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      return;
    }

    try {
      await contentApi.deleteNote(noteId);
      toast({
        title: "Success",
        description: "Note deleted successfully.",
      });
      // Refresh notes to remove deleted note
      fetchPublicNotes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete note. Please try again.",
        variant: "destructive",
      });
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setAuthorFilter('');
    setDateFrom('');
    setSortBy('recent');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Function to strip HTML tags from text
  const stripHtmlTags = (html: string) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  };

  const renderNoteCard = (note: Note, isLibrary: boolean = false) => (
    <Card key={note.note_id} className="group border-2 border-gray-100 hover:border-gray-900 shadow-xl hover:shadow-2xl transition-all duration-500 bg-white hover:-translate-y-1 transform-gpu">
      <CardHeader className="pb-3">
        <div className="space-y-3">
          {/* Top row with icon, category, and status badges */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn(
                "p-2 rounded-xl border border-gray-200",
                note.content_type === 'pdf'
                  ? "bg-gradient-to-r from-red-50 to-red-100"
                  : "bg-gradient-to-r from-gray-50 to-gray-100"
              )}>
                {note.content_type === 'pdf' ? (
                  <File className="h-4 w-4 text-red-600" />
                ) : (
                  <FileText className="h-4 w-4 text-gray-700" />
                )}
              </div>
              <Badge className={cn(
                "px-2 py-1 text-xs font-medium rounded-md",
                note.category === 'Study Notes' && "bg-blue-100 text-blue-700",
                note.category === 'Practice Notes' && "bg-green-100 text-green-700",
                note.category === 'Research' && "bg-purple-100 text-purple-700",
                note.category === 'Case Notes' && "bg-orange-100 text-orange-700",
                note.category === 'Meeting Notes' && "bg-red-100 text-red-700",
                note.category === 'General' && "bg-gray-100 text-gray-700",
                !['Study Notes', 'Practice Notes', 'Research', 'Case Notes', 'Meeting Notes', 'General'].includes(note.category) && "bg-gray-100 text-gray-700"
              )}>
                {note.category.startsWith('Saved - ') ? note.category.replace('Saved - ', '') : note.category}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              {isLibrary && (note.note_type === 'saved' || note.title.startsWith('[SAVED]')) && (
                <Badge variant="outline" className="text-xs border-gray-600 text-gray-600 bg-gray-50 px-2 py-0.5">
                  <Copy className="h-3 w-3 mr-1" />
                  Saved
                </Badge>
              )}
              {isLibrary && note.is_private && (
                <Lock className="h-3 w-3 text-gray-500" />
              )}
              {!isLibrary && !note.is_private && (
                <Globe className="h-3 w-3 text-green-500" />
              )}
            </div>
          </div>

          {/* Title */}
          <CardTitle className="text-lg font-bold text-black modern-heading group-hover:text-gray-900 line-clamp-2 leading-tight">
            {note.title.startsWith('[SAVED]') ? note.title.replace('[SAVED] ', '') : note.title}
          </CardTitle>

          {/* Description */}
          <CardDescription className="line-clamp-2 text-gray-600 text-sm leading-relaxed">
            {note.summary ? stripHtmlTags(note.summary) : (note.content ? stripHtmlTags(note.content).substring(0, 120) + '...' : 'No content available')}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-3 pb-4">
        <div className="space-y-3">
          {/* Author and Date Info */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span className="font-medium truncate">
                {isLibrary && note.note_type === 'saved' && note.original_author_name
                  ? `Originally by ${note.original_author_name}`
                  : note.author_name}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(isLibrary && note.saved_at ? note.saved_at : note.created_at || new Date().toISOString()), 'MMM dd, yyyy')}</span>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>{note.view_count || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              <span>{note.save_count || 0}</span>
            </div>
          </div>

          {/* Action Buttons - Responsive Layout */}
          <div className="flex flex-wrap gap-2 pt-1">
            {!isLibrary && canSaveContent && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSaveNote(note)}
                className="flex items-center gap-1 border border-gray-300 text-gray-700 hover:border-gray-900 hover:bg-gray-50 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300"
              >
                <Bookmark className="h-3 w-3" />
                Save
              </Button>
            )}

            {/* Show edit button for admin (all notes) or editor (own notes only) */}
            {((user?.role === UserRole.ADMIN) ||
              (user?.role === UserRole.EDITOR && note.user_id === parseInt(user.id))) && (
              <Button variant="outline" size="sm" asChild className="border border-gray-300 text-gray-700 hover:border-gray-900 hover:bg-gray-50 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300">
                <Link to={`/notes/${note.note_id}/edit`}>
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Link>
              </Button>
            )}

            {/* Show delete button for admin (all notes) or editor (own notes only) */}
            {((user?.role === UserRole.ADMIN) ||
              (user?.role === UserRole.EDITOR && note.user_id === parseInt(user.id))) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteNote(note.note_id)}
                className="text-red-600 hover:text-red-700 border border-red-300 hover:border-red-400 hover:bg-red-50 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            )}

            <Button
              asChild
              className="bg-black hover:bg-gray-800 text-white px-4 py-1.5 rounded-lg text-xs font-semibold shadow-md hover:shadow-lg transition-all duration-300 group ml-auto"
            >
              <Link to={`/notes/${note.note_id}`}>
                Read More
                <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-0.5 transition-transform duration-300" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Modern Header Section */}
          <div className="relative overflow-hidden">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-3xl bg-gradient-to-br from-gray-900 to-black shadow-xl border border-gray-200">
                    <FileText className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-black tracking-tight modern-heading">
                      Legal Notes Collection
                    </h1>
                    <p className="text-gray-700 text-lg font-medium mt-2">
                      Discover, save, and organize professional legal notes and insights
                    </p>
                  </div>
                </div>

                {/* Stats Bar */}
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-gray-800" />
                    <span className="font-medium">{publicNotes.length} Available Notes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-gray-800" />
                    <span className="font-medium">{publicNotes.filter(n => (n.save_count || 0) > 5).length} Popular</span>
                  </div>
                </div>
              </div>

              {canCreateContent && (
                <Button
                  asChild
                  size="lg"
                  className="bg-black hover:bg-gray-800 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group border border-gray-200"
                >
                  <Link to="/notes/create">
                    <Plus className="h-5 w-5 mr-3 group-hover:rotate-90 transition-transform duration-300" />
                    Create New Note
                    <ArrowRight className="h-5 w-5 ml-3 group-hover:translate-x-1 transition-transform duration-300" />
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Public Notes Section */}
          <div className="space-y-6">
            {/* Enhanced Search and Filters */}
            <Card className="border-2 border-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white">
              <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white shadow-md border border-gray-300">
                    <Search className="h-5 w-5 text-gray-800" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-black modern-heading">Search & Filter Notes</CardTitle>
                    <p className="text-gray-600 text-sm">Find notes by keywords, category, or author</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    placeholder="Search by keywords, title, or content..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 border-2 border-gray-200 focus:border-gray-900 focus:ring-gray-900/10 rounded-xl text-lg font-medium transition-all duration-300"
                  />
                </div>

                {/* Filter Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-gray-900 rounded-xl font-medium">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-gray-600" />
                        <SelectValue placeholder="All Categories" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Filter by author..."
                    value={authorFilter}
                    onChange={(e) => setAuthorFilter(e.target.value)}
                    className="h-12 border-2 border-gray-200 focus:border-gray-900 focus:ring-gray-900/10 rounded-xl font-medium transition-all duration-300"
                  />

                  <Input
                    type="date"
                    placeholder="From date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="h-12 border-2 border-gray-200 focus:border-gray-900 focus:ring-gray-900/10 rounded-xl font-medium transition-all duration-300"
                  />
                </div>

                {/* Sort and Clear */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <Select value={sortBy} onValueChange={(value: 'recent' | 'popular' | 'saved') => setSortBy(value)}>
                    <SelectTrigger className="w-full sm:w-[240px] h-12 border-2 border-gray-200 focus:border-gray-900 rounded-xl font-medium">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-gray-600" />
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Most Recent</SelectItem>
                      <SelectItem value="popular">Most Popular</SelectItem>
                      <SelectItem value="saved">Most Saved</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="border-2 border-gray-200 text-gray-700 hover:border-gray-900 hover:bg-gray-50 px-6 py-3 rounded-xl font-medium transition-all duration-300"
                  >
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Notes Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-r from-yellow-100 to-orange-100 border border-yellow-200">
                  <Star className="h-5 w-5 text-yellow-600" />
                </div>
                <h2 className="text-2xl font-bold text-black modern-heading">
                  {sortBy === 'popular' ? 'Popular Notes' :
                   sortBy === 'saved' ? 'Most Saved Notes' : 'Recent Notes'}
                </h2>
              </div>

              {loading ? (
                <div className="space-y-6">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="border-2 border-gray-100 shadow-xl bg-white">
                      <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-gray-100">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-4 flex-1">
                            <Skeleton className="h-12 w-12 rounded-xl" />
                            <div className="space-y-3 flex-1">
                              <Skeleton className="h-6 w-3/4" />
                              <Skeleton className="h-4 w-1/2" />
                            </div>
                          </div>
                          <Skeleton className="h-6 w-20" />
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-2/3" />
                          <div className="flex justify-between items-center pt-4">
                            <div className="flex gap-4">
                              <Skeleton className="h-4 w-16" />
                              <Skeleton className="h-4 w-16" />
                            </div>
                            <div className="flex gap-2">
                              <Skeleton className="h-8 w-20" />
                              <Skeleton className="h-8 w-24" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : publicNotes.length === 0 ? (
                <Card className="border-2 border-gray-100 shadow-xl bg-gradient-to-br from-gray-50 to-white">
                  <CardContent className="text-center py-16">
                    <div className="p-6 rounded-3xl bg-gray-100 w-fit mx-auto mb-8">
                      <BookOpen className="h-16 w-16 text-gray-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-black mb-3 modern-heading">No Notes Found</h3>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
                      Try adjusting your search or filter criteria to find more notes.
                    </p>
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      className="border-2 border-gray-200 text-gray-700 hover:border-gray-900 hover:bg-gray-50 px-6 py-3 rounded-xl font-medium transition-all duration-300"
                    >
                      Clear Filters
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {publicNotes.map((note) => renderNoteCard(note, false))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notes;
