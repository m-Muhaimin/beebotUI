import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Conversation } from "@shared/schema";

export function useBookmarks() {
  const queryClient = useQueryClient();

  const bookmarkedConversations = useQuery<Conversation[]>({
    queryKey: ['/api/conversations/bookmarked'],
    staleTime: 30000, // Cache for 30 seconds
  });

  const toggleBookmark = useMutation({
    mutationFn: async (conversationId: string) => {
      return apiRequest(`/api/conversations/${conversationId}/bookmark`, "POST");
    },
    onSuccess: (data, conversationId) => {
      // Update the conversations list
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations/bookmarked'] });
      
      // Update the specific conversation if it's cached
      queryClient.invalidateQueries({ 
        queryKey: ['/api/conversations', conversationId] 
      });
    },
    onError: (error) => {
      console.error('Failed to toggle bookmark:', error);
    }
  });

  return {
    bookmarkedConversations: bookmarkedConversations.data || [],
    isLoadingBookmarks: bookmarkedConversations.isLoading,
    toggleBookmark: toggleBookmark.mutateAsync,
    isTogglingBookmark: toggleBookmark.isPending,
  };
}