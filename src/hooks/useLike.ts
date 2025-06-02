import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { contentApi } from '@/services/api';

interface LikeState {
  isLiked: boolean;
  likeCount: number;
  isLoading: boolean;
  error: string | null;
}

/**
 * Custom hook for managing like functionality on content (blog posts, research papers, etc.)
 * Provides methods to like/unlike content and track like status
 */
export const useLike = (contentId: number) => {
  const { user, isAuthenticated } = useAuth();
  const [state, setState] = useState<LikeState>({
    isLiked: false,
    likeCount: 0,
    isLoading: false,
    error: null
  });

  // Fetch initial like status
  useEffect(() => {
    if (contentId && user && isAuthenticated) {
      fetchLikeStatus();
    }
  }, [contentId, user, isAuthenticated]);

  const fetchLikeStatus = async () => {
    if (!user || !isAuthenticated) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const data = await contentApi.getLikeStatus(contentId);

      setState(prev => ({
        ...prev,
        isLiked: data.is_liked,
        likeCount: data.like_count,
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch like status',
        isLoading: false
      }));
    }
  };

  const toggleLike = async () => {
    if (!user || !isAuthenticated) {
      setState(prev => ({ ...prev, error: 'Please log in to like content' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const data = await contentApi.likeContent(contentId);

      if (data.success) {
        setState(prev => ({
          ...prev,
          isLiked: data.is_liked || false,
          likeCount: data.like_count || 0,
          isLoading: false
        }));

        // Show success message (optional)
        console.log(data.message);
      } else {
        setState(prev => ({
          ...prev,
          error: data.message || 'Failed to toggle like',
          isLoading: false
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to toggle like',
        isLoading: false
      }));
    }
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  return {
    isLiked: state.isLiked,
    likeCount: state.likeCount,
    isLoading: state.isLoading,
    error: state.error,
    toggleLike,
    clearError,
    refetch: fetchLikeStatus
  };
};
