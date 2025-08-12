import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Sidebar from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Bookmark, PanelLeftOpen, PanelLeftClose } from "lucide-react";
import type { Conversation } from "@shared/schema";

export default function BookmarkedPage() {
  const [activeNav, setActiveNav] = useState("bookmarked");
  const [, setLocation] = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return window.innerWidth < 1024;
  });

  const { data: bookmarkedConversations = [], isLoading } = useQuery<Conversation[]>({
    queryKey: ['/api/conversations/bookmarked'],
    staleTime: 30000,
  });

  const handleConversationClick = (conversationId: string) => {
    setLocation(`/conversation/${conversationId}`);
  };

  return (
    <div className="flex h-screen" data-testid="bookmarked-page">
      <Sidebar 
        activeNav={activeNav} 
        onNavChange={setActiveNav}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <Button 
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-blue-600 p-2 lg:hidden"
                data-testid="button-toggle-sidebar-mobile"
              >
                {isSidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
              </Button>
              <div>
                <h1 className="font-semibold text-slate-800 text-lg sm:text-xl">
                  Bookmarked Conversations
                </h1>
                <p className="text-slate-500 text-sm">
                  Your saved important conversations
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {isLoading ? (
            <div className="grid gap-4">
              {[...Array(6)].map((_, i) => (
                <div 
                  key={i} 
                  className="w-full h-20 bg-slate-100 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : bookmarkedConversations.length === 0 ? (
            <div className="text-center py-12">
              <Bookmark className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-800 mb-2">
                No bookmarked conversations yet
              </h3>
              <p className="text-slate-500 mb-6">
                Bookmark important conversations to find them easily later
              </p>
              <Button 
                onClick={() => setLocation("/")}
                className="bg-brand-blue hover:bg-brand-blue/90"
              >
                Start a New Conversation
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 max-w-4xl">
              {bookmarkedConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => handleConversationClick(conversation.id)}
                  className="bg-white border border-slate-200 rounded-lg p-4 hover:border-brand-blue/50 hover:shadow-sm transition-all cursor-pointer group"
                  data-testid={`conversation-card-${conversation.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-slate-800 group-hover:text-brand-blue transition-colors truncate">
                        {conversation.title}
                      </h3>
                      <p className="text-sm text-slate-500 mt-1">
                        Last updated {new Date(conversation.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Bookmark className="w-4 h-4 text-yellow-600 fill-current" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}