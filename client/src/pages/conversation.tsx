import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import InputSection from "@/components/input-section";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Button } from "@/components/ui/button";
import {
  PlusIcon,
  User,
  Bot,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useBookmarks } from "@/hooks/useBookmarks";
import type { Message, Conversation } from "@shared/schema";

interface ConversationData {
  conversation: Conversation;
  messages: Message[];
}

export default function ConversationPage() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const [activeNav, setActiveNav] = useState("home");
  const [message, setMessage] = useState("");
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    // Default to collapsed on mobile devices
    return window.innerWidth < 1024;
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isRequestInProgress = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { toggleBookmark, isTogglingBookmark } = useBookmarks();

  const conversationId = params.id;

  const { data: conversationData, isLoading } = useQuery<ConversationData>({
    queryKey: ["/api/conversations", conversationId],
    enabled: !!conversationId,
    retry: 3,
    retryDelay: 500,
    staleTime: isStreaming ? 10000 : 1000, // Prevent refetching during streaming
    refetchOnWindowFocus: !isStreaming, // Don't refetch during streaming
  });

  // Auto-trigger AI response for new conversations with proper safeguards
  const hasAutoTriggered = useRef(new Set<string>());

  useEffect(() => {
    if (
      conversationData?.messages &&
      conversationData.messages.length === 1 &&
      conversationId &&
      !hasAutoTriggered.current.has(conversationId) &&
      !isStreaming &&
      !isRequestInProgress.current
    ) {
      const lastMessage = conversationData.messages[0];

      // Only auto-trigger if the single message is from user
      if (lastMessage.role === "user") {
        console.log(
          `Auto-triggering AI response for conversation ${conversationId}`,
        );
        hasAutoTriggered.current.add(conversationId);
        isRequestInProgress.current = true;
        setIsStreaming(true);
        setStreamingMessage("");

        // Start the AI response immediately
        const triggerAIResponse = async () => {
          try {
            abortControllerRef.current = new AbortController();
            const response = await fetch(`/api/chat/${conversationId}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                message: lastMessage.content,
                skipSaveMessage: true, // Don't save the user message again
                selectedTool: selectedTool || null,
              }),
              signal: abortControllerRef.current.signal,
            });

            if (!response.ok) {
              throw new Error("Failed to get AI response");
            }

            const reader = response.body?.getReader();
            if (!reader) {
              throw new Error("No response reader");
            }

            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";

              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  try {
                    const data = JSON.parse(line.slice(6));

                    if (data.content) {
                      setStreamingMessage((prev) => prev + data.content);
                    }

                    if (data.error) {
                      toast({
                        title: "Error",
                        description: data.error,
                        variant: "destructive",
                      });
                      break;
                    }

                    if (data.finished) {
                      setStreamingMessage("");
                      setIsStreaming(false);
                      // Delay query invalidation to prevent blinking during stream
                      setTimeout(() => {
                        queryClient.invalidateQueries({
                          queryKey: ["/api/conversations", conversationId],
                        });
                        queryClient.invalidateQueries({
                          queryKey: ["/api/conversations"],
                        });
                      }, 100);
                      break;
                    }
                  } catch (e) {
                    // Skip malformed JSON
                  }
                }
              }
            }
          } catch (error: any) {
            if (error.name === "AbortError") {
              console.log("Auto-trigger AI response was aborted");
              // Don't clear streaming message on abort - let handleStopStreaming handle it
            } else {
              console.error("Failed to get AI response:", error);
              toast({
                title: "Error",
                description: "Failed to get AI response",
                variant: "destructive",
              });
              setIsStreaming(false);
              setStreamingMessage("");
              isRequestInProgress.current = false;
            }
          } finally {
            abortControllerRef.current = null;
          }
        };

        // Start the AI response
        triggerAIResponse();
      }
    }
  }, [
    conversationData,
    conversationId,
    isStreaming,
    queryClient,
    toast,
    selectedTool,
  ]);

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // If we have partial streaming content, save it as a complete message
    if (streamingMessage.trim()) {
      // Optimistically add the partial AI response to the conversation
      queryClient.setQueryData(
        ["/api/conversations", conversationId],
        (oldData: ConversationData | undefined) => {
          if (!oldData) return oldData;

          const newMessage = {
            id: `temp-stopped-${Date.now()}`,
            conversationId: conversationId!,
            role: "assistant" as const,
            content: streamingMessage + " [Response stopped by user]",
            createdAt: new Date(),
            updatedAt: new Date(),
            metadata: null,
          };

          return {
            ...oldData,
            messages: [...oldData.messages, newMessage],
          };
        },
      );
    }

    setIsStreaming(false);
    setStreamingMessage("");
    isRequestInProgress.current = false;
  };

  const deleteConversationMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/conversations/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setLocation("/");
      toast({
        title: "Success",
        description: "Conversation deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive",
      });
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Show streaming when we're in a new conversation that might be loading
  const shouldShowInitialStreaming =
    isLoading && !conversationData && !isStreaming;

  useEffect(() => {
    scrollToBottom();
  }, [conversationData?.messages, streamingMessage]);

  const handleSendMessage = async () => {
    if (
      !message.trim() ||
      !conversationId ||
      isStreaming ||
      isRequestInProgress.current
    )
      return;

    isRequestInProgress.current = true;
    const messageToSend = message;
    setMessage("");
    setIsStreaming(true);
    setStreamingMessage("");

    // Optimistically add user message to the UI immediately
    queryClient.setQueryData(
      ["/api/conversations", conversationId],
      (oldData: ConversationData | undefined) => {
        if (!oldData) return oldData;

        const newMessage = {
          id: `temp-${Date.now()}`,
          conversationId,
          role: "user" as const,
          content: messageToSend,
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: null,
        };

        return {
          ...oldData,
          messages: [...oldData.messages, newMessage],
        };
      },
    );

    try {
      abortControllerRef.current = new AbortController();
      const response = await fetch(`/api/chat/${conversationId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageToSend,
          selectedTool: selectedTool,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response reader");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.content) {
                setStreamingMessage((prev) => prev + data.content);
              }

              if (data.error) {
                toast({
                  title: "Error",
                  description: data.error,
                  variant: "destructive",
                });
                break;
              }

              if (data.finished) {
                setStreamingMessage("");
                setIsStreaming(false);
                // Delay query invalidation to prevent blinking during stream
                setTimeout(() => {
                  queryClient.invalidateQueries({
                    queryKey: ["/api/conversations", conversationId],
                  });
                  queryClient.invalidateQueries({
                    queryKey: ["/api/conversations"],
                  });
                }, 100);
                break;
              }
            } catch (e) {
              // Skip malformed JSON
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("Message sending was aborted");
        // Don't clear streaming message on abort - let handleStopStreaming handle it
      } else {
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive",
        });
        setMessage(messageToSend); // Restore message on error
        setIsStreaming(false);
        setStreamingMessage("");
        isRequestInProgress.current = false;
      }
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleQuickAction = (action: string) => {
    // Tools are activated but don't modify the input field text
    // The tool selection will be handled visually through the UI state
  };

  const handleDeleteConversation = () => {
    if (!conversationId) return;
    deleteConversationMutation.mutate(conversationId);
  };

  const handleBookmarkToggle = async () => {
    if (!conversationId) return;
    try {
      await toggleBookmark(conversationId);
      toast({
        title: "Bookmark updated",
        description: conversationData?.conversation.isBookmarked
          ? "Conversation removed from bookmarks"
          : "Conversation added to bookmarks",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update bookmark",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen" data-testid="conversation-page">
        <Sidebar
          activeNav={activeNav}
          onNavChange={setActiveNav}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        <Button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-primary p-2 lg:hidden fixed top-4 left-4 z-50 bg-background border border-border rounded-full shadow-sm"
          data-testid="button-toggle-sidebar-mobile"
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </Button>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading conversation...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!conversationData) {
    return (
      <div className="flex h-screen" data-testid="conversation-page">
        <Sidebar
          activeNav={activeNav}
          onNavChange={setActiveNav}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        <Button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-primary p-2 lg:hidden fixed top-4 left-4 z-50 bg-background border border-border rounded-full shadow-sm"
          data-testid="button-toggle-sidebar-mobile"
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </Button>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Conversation not found</p>
            <Button onClick={() => setLocation("/")}>Go Home</Button>
          </div>
        </main>
      </div>
    );
  }

  const { conversation, messages } = conversationData;

  return (
    <div className="flex h-screen" data-testid="conversation-page">
      <Sidebar
        activeNav={activeNav}
        onNavChange={setActiveNav}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header - Responsive */}
        <header className="bg-background dark:bg-background border-b border-border px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
              <div className="min-w-0">
                <h1
                  className="font-semibold text-foreground dark:text-foreground text-sm sm:text-[16px] truncate"
                  data-testid="conversation-title"
                >
                  {conversation.title}
                </h1>
                <p className="text-muted-foreground text-xs sm:text-[13px]">
                  Started{" "}
                  {new Date(conversation.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-primary p-2 lg:hidden fixed top-4 left-4 z-50 bg-background border border-border rounded-full shadow-sm"
                data-testid="button-toggle-sidebar-mobile"
              >
                {isSidebarCollapsed ? (
                  <PanelLeftOpen className="w-4 h-4" />
                ) : (
                  <PanelLeftClose className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBookmarkToggle}
                disabled={isTogglingBookmark}
                className={`${
                  conversation.isBookmarked
                    ? "text-yellow-600 border-yellow-200 bg-yellow-50 hover:bg-yellow-100"
                    : "text-muted-foreground border-border hover:bg-muted"
                } transition-colors`}
                data-testid="button-bookmark-conversation"
              >
                {conversation.isBookmarked ? (
                  <BookmarkCheck className="w-4 h-4" />
                ) : (
                  <Bookmark className="w-4 h-4" />
                )}
                <span className="ml-2 hidden sm:inline">
                  {conversation.isBookmarked ? "Bookmarked" : "Bookmark"}
                </span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteConversation}
                disabled={deleteConversationMutation.isPending}
                className="text-destructive border-destructive/30 hover:bg-destructive/10 hidden sm:flex"
                data-testid="button-delete-conversation"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                <span className="hidden md:inline">Delete</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteConversation}
                disabled={deleteConversationMutation.isPending}
                className="text-destructive border-destructive/30 hover:bg-destructive/10 sm:hidden p-2"
                data-testid="button-delete-conversation-mobile"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => setLocation("/")}
                data-testid="button-new-chat"
                size="sm"
              >
                <PlusIcon className="w-4 h-4 mr-0 sm:mr-2" />
                <span className="hidden sm:inline">New Chat</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Messages - Responsive */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-6">
          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start space-x-3 sm:space-x-4 ${
                  msg.role === "user" ? "justify-end" : ""
                }`}
                data-testid={`message-${msg.role}-${msg.id}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-primary">
                    <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
                  </div>
                )}
                <div
                  className={`max-w-xs sm:max-w-2xl lg:max-w-3xl p-3 sm:p-4 rounded-xl ${
                    msg.role === "user"
                      ? "px-4 sm:px-6 py-3 sm:py-4 bg-primary text-primary-foreground"
                      : "px-4 sm:px-6 py-3 sm:py-4 bg-muted text-foreground"
                  }`}
                >
                  <MarkdownRenderer content={msg.content} />
                </div>
                {msg.role === "user" && (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-muted-foreground rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-background" />
                  </div>
                )}
              </div>
            ))}

            {/* Streaming message - Responsive */}
            {isStreaming && streamingMessage && (
              <div
                className="flex items-start space-x-3 sm:space-x-4"
                data-testid="streaming-message"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
                </div>
                <div className="max-w-xs sm:max-w-2xl lg:max-w-3xl p-3 sm:p-4 rounded-xl bg-muted text-foreground">
                  <MarkdownRenderer content={streamingMessage} />
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full animate-pulse" />
                    <p className="text-xs text-muted-foreground">Typing...</p>
                  </div>
                </div>
              </div>
            )}

            {/* Loading indicator - Responsive */}
            {((isStreaming && !streamingMessage) ||
              shouldShowInitialStreaming) && (
              <div
                className="flex items-start space-x-3 sm:space-x-4"
                data-testid="loading-message"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-primary">
                  <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
                </div>

                {/* Loading dots - Responsive */}
                <div className="max-w-xs sm:max-w-2xl lg:max-w-3xl p-3 sm:p-4 rounded-xl text-foreground bg-muted">
                  <div className="flex items-center space-x-1.5">
                    <div className="w-1.3 h-1.3 sm:w-1.3 sm:h-1.3 bg-muted-foreground rounded-full animate-bounce" />
                    <div
                      className="w-1 h-1 sm:w-1 sm:h-1 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    />

                    <div
                      className="w-1 h-1 sm:w-1 sm:h-1 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    />
                    {/*<span className="text-xs sm:text-sm text-slate-600 ml-2">
                      AI is thinking...
                    </span>*/}
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        <InputSection
          message={message}
          onMessageChange={setMessage}
          onSendMessage={handleSendMessage}
          onQuickAction={handleQuickAction}
          selectedTool={selectedTool}
          onToolChange={setSelectedTool}
          isStreaming={isStreaming}
          onStopStreaming={handleStopStreaming}
        />
      </main>
    </div>
  );
}
