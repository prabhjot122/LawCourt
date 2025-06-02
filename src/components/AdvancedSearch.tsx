import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Search,
  Filter,
  X,
  Calendar,
  Tag,
  User,
  FileText,
  SlidersHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchFilters {
  query: string;
  contentType: string[];
  category: string[];
  tags: string[];
  author: string;
  dateRange: {
    from: string;
    to: string;
  };
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  contentTypes?: string[];
  categories?: string[];
  availableTags?: string[];
  className?: string;
  placeholder?: string;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  onSearch,
  contentTypes = ['Blog Posts', 'Research Papers', 'Jobs', 'Internships'],
  categories = ['Constitutional Law', 'Corporate Law', 'Employment Law', 'Intellectual Property', 'Criminal Law', 'Family Law'],
  availableTags = ['legal', 'research', 'analysis', 'case-study', 'opinion', 'news'],
  className,
  placeholder = "Search across all content...",
}) => {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    contentType: [],
    category: [],
    tags: [],
    author: '',
    dateRange: {
      from: '',
      to: '',
    },
    sortBy: 'relevance',
    sortOrder: 'desc',
  });

  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearch(filters);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters, onSearch]);

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayFilter = (key: 'contentType' | 'category' | 'tags', value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(item => item !== value)
        : [...prev[key], value]
    }));
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      contentType: [],
      category: [],
      tags: [],
      author: '',
      dateRange: { from: '', to: '' },
      sortBy: 'relevance',
      sortOrder: 'desc',
    });
  };

  const hasActiveFilters = 
    filters.contentType.length > 0 ||
    filters.category.length > 0 ||
    filters.tags.length > 0 ||
    filters.author ||
    filters.dateRange.from ||
    filters.dateRange.to ||
    filters.sortBy !== 'relevance';

  const activeFilterCount = 
    filters.contentType.length +
    filters.category.length +
    filters.tags.length +
    (filters.author ? 1 : 0) +
    (filters.dateRange.from ? 1 : 0) +
    (filters.dateRange.to ? 1 : 0) +
    (filters.sortBy !== 'relevance' ? 1 : 0);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={placeholder}
            value={filters.query}
            onChange={(e) => updateFilter('query', e.target.value)}
            className="pl-10 pr-4"
          />
        </div>
        <Popover open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-0" align="end">
            <Card className="border-0 shadow-none">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Advanced Filters</CardTitle>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Content Type */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Content Type
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {contentTypes.map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`type-${type}`}
                          checked={filters.contentType.includes(type)}
                          onCheckedChange={() => toggleArrayFilter('contentType', type)}
                        />
                        <Label htmlFor={`type-${type}`} className="text-sm">
                          {type}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Category</Label>
                  <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                    {categories.map((category) => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox
                          id={`cat-${category}`}
                          checked={filters.category.includes(category)}
                          onCheckedChange={() => toggleArrayFilter('category', category)}
                        />
                        <Label htmlFor={`cat-${category}`} className="text-sm">
                          {category}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Tags
                  </Label>
                  <div className="flex flex-wrap gap-1">
                    {availableTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant={filters.tags.includes(tag) ? "default" : "outline"}
                        className="cursor-pointer text-xs"
                        onClick={() => toggleArrayFilter('tags', tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Author */}
                <div className="space-y-2">
                  <Label htmlFor="author" className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Author
                  </Label>
                  <Input
                    id="author"
                    placeholder="Search by author name..."
                    value={filters.author}
                    onChange={(e) => updateFilter('author', e.target.value)}
                  />
                </div>

                {/* Date Range */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date Range
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="date-from" className="text-xs text-gray-500">From</Label>
                      <Input
                        id="date-from"
                        type="date"
                        value={filters.dateRange.from}
                        onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, from: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="date-to" className="text-xs text-gray-500">To</Label>
                      <Input
                        id="date-to"
                        type="date"
                        value={filters.dateRange.to}
                        onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, to: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Sort */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Sort By</Label>
                  <div className="flex gap-2">
                    <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">Relevance</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="title">Title</SelectItem>
                        <SelectItem value="author">Author</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filters.sortOrder} onValueChange={(value: 'asc' | 'desc') => updateFilter('sortOrder', value)}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">Desc</SelectItem>
                        <SelectItem value="asc">Asc</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.contentType.map((type) => (
            <Badge key={type} variant="secondary" className="gap-1">
              {type}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => toggleArrayFilter('contentType', type)}
              />
            </Badge>
          ))}
          {filters.category.map((cat) => (
            <Badge key={cat} variant="secondary" className="gap-1">
              {cat}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => toggleArrayFilter('category', cat)}
              />
            </Badge>
          ))}
          {filters.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              #{tag}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => toggleArrayFilter('tags', tag)}
              />
            </Badge>
          ))}
          {filters.author && (
            <Badge variant="secondary" className="gap-1">
              Author: {filters.author}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => updateFilter('author', '')}
              />
            </Badge>
          )}
          {(filters.dateRange.from || filters.dateRange.to) && (
            <Badge variant="secondary" className="gap-1">
              Date: {filters.dateRange.from || '...'} - {filters.dateRange.to || '...'}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => updateFilter('dateRange', { from: '', to: '' })}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;
