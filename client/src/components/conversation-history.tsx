import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { useLocation } from "wouter";
import type { Conversation } from "@shared/schema";

interface ConversationHistoryProps {
  onSelectConversation?: (conversationId: string) => void;
}

export default function ConversationHistory({ onSelectConversation }: ConversationHistoryProps) {
  const [, setLocation] = useLocation();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    recent: true,
    week: true,
  });

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['/api/conversations'],
    enabled: true,
  });

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const handleConversationClick = (conversationId: string) => {
    if (onSelectConversation) {
      onSelectConversation(conversationId);
    } else {
      setLocation(`/conversation/${conversationId}`);
    }
  };

  // Group conversations by time period
  const groupConversationsByTime = (conversations: Conversation[]) => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const recent: Conversation[] = [];
    const week: Conversation[] = [];

    conversations.forEach(conv => {
      const convDate = new Date(conv.updatedAt);
      if (convDate >= yesterday) {
        recent.push(conv);
      } else if (convDate >= weekAgo) {
        week.push(conv);
      }
    });

    return { recent, week };
  };

  if (isLoading) {
    return (
      <div className="mt-8" data-testid="conversation-history">
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-full h-12 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const { recent, week } = groupConversationsByTime(conversations);

  return (
    <div className="mt-8" data-testid="conversation-history">
      {/* Recent Section */}
      {recent.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => toggleSection("recent")}
            className="flex items-center justify-between w-full text-left text-xs font-medium text-slate-500 uppercase tracking-wider mb-3 hover:text-slate-700 transition-colors duration-150"
            data-testid="button-toggle-recent"
          >
            <span>Recent</span>
            <ChevronDown 
              className={`w-4 h-4 transform transition-transform duration-150 ${
                expandedSections.recent ? "rotate-0" : "-rotate-90"
              }`} 
            />
          </button>
          {expandedSections.recent && (
            <div className="space-y-2" data-testid="section-recent">
              {recent.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => handleConversationClick(conversation.id)}
                  className="w-full text-left p-3 text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors duration-150 border border-transparent hover:border-slate-200 pt-[5px] pb-[5px] text-[14px] pl-[8px] pr-[8px] bg-[#ffffff]"
                  data-testid={`button-history-conversation-${conversation.id}`}
                >
                  {conversation.title}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {/* Week Section */}
      {week.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => toggleSection("week")}
            className="flex items-center justify-between w-full text-left text-xs font-medium text-slate-500 uppercase tracking-wider mb-3 hover:text-slate-700 transition-colors duration-150"
            data-testid="button-toggle-week"
          >
            <span>7 Days Ago</span>
            <ChevronDown 
              className={`w-4 h-4 transform transition-transform duration-150 ${
                expandedSections.week ? "rotate-0" : "-rotate-90"
              }`} 
            />
          </button>
          {expandedSections.week && (
            <div className="space-y-2" data-testid="section-week">
              {week.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => handleConversationClick(conversation.id)}
                  className="w-full text-left p-3 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors duration-150 border border-transparent hover:border-slate-200"
                  data-testid={`button-history-conversation-${conversation.id}`}
                >
                  {conversation.title}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {/* Empty state */}
      {conversations.length === 0 && !isLoading && (
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500">No conversations yet</p>
          <p className="text-xs text-slate-400 mt-1">Start chatting to see your history here</p>
        </div>
      )}
    </div>
  );
}
