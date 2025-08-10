import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import InputSection from "@/components/input-section";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Button } from "@/components/ui/button";
import { PlusIcon, User, Bot, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const conversationId = params.id;

  const { data: conversationData, isLoading } = useQuery<ConversationData>({
    queryKey: ['/api/conversations', conversationId],
    enabled: !!conversationId,
    retry: 3,
    retryDelay: 500,
  });

  // Auto-trigger AI response for new conversations
  useEffect(() => {
    if (conversationData?.messages && conversationData.messages.length > 0 && !isStreaming) {
      const messages = conversationData.messages;
      const lastMessage = messages[messages.length - 1];
      
      // If the last message is from user and there's no assistant response, trigger AI response
      if (lastMessage.role === 'user' && messages.length === 1 && !streamingMessage) {
        // This is a new conversation with only the user's message - start AI response
        setIsStreaming(true);
        setStreamingMessage("");
        
        // Start the AI response immediately
        const triggerAIResponse = async () => {
          try {
            const response = await fetch(`/api/chat/${conversationId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ message: lastMessage.content, skipSaveMessage: true }),
            });

            if (!response.ok) {
              throw new Error('Failed to get AI response');
            }

            const reader = response.body?.getReader();
            if (!reader) {
              throw new Error('No response reader');
            }

            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
              const { done, value } = await reader.read();
              
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6));
                    
                    if (data.content) {
                      setStreamingMessage(prev => prev + data.content);
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
                      queryClient.invalidateQueries({ queryKey: ['/api/conversations', conversationId] });
                      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
                      break;
                    }
                  } catch (e) {
                    // Skip malformed JSON
                  }
                }
              }
            }
          } catch (error) {
            toast({
              title: "Error",
              description: "Failed to get AI response",
              variant: "destructive",
            });
          } finally {
            setIsStreaming(false);
            setStreamingMessage("");
          }
        };
        
        // Start the AI response
        triggerAIResponse();
      }
    }
  }, [conversationData, conversationId, isStreaming, queryClient, toast]);

  const deleteConversationMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/conversations/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      setLocation('/');
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
  const shouldShowInitialStreaming = isLoading && !conversationData && !isStreaming;

  useEffect(() => {
    scrollToBottom();
  }, [conversationData?.messages, streamingMessage]);

  const handleSendMessage = async () => {
    if (!message.trim() || !conversationId || isStreaming) return;

    const messageToSend = message;
    setMessage("");
    setIsStreaming(true);
    setStreamingMessage("");

    // Optimistically add user message to the UI immediately
    queryClient.setQueryData(['/api/conversations', conversationId], (oldData: ConversationData | undefined) => {
      if (!oldData) return oldData;
      
      const newMessage = {
        id: `temp-${Date.now()}`,
        conversationId,
        role: 'user' as const,
        content: messageToSend,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: null
      };
      
      return {
        ...oldData,
        messages: [...oldData.messages, newMessage]
      };
    });

    try {
      const response = await fetch(`/api/chat/${conversationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: messageToSend,
          selectedTool: selectedTool 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response reader');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.content) {
                setStreamingMessage(prev => prev + data.content);
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
                queryClient.invalidateQueries({ queryKey: ['/api/conversations', conversationId] });
                queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
                break;
              }
            } catch (e) {
              // Skip malformed JSON
            }
          }
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
      setMessage(messageToSend); // Restore message on error
    } finally {
      setIsStreaming(false);
      setStreamingMessage("");
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

  if (isLoading) {
    return (
      <div className="flex h-screen" data-testid="conversation-page">
        <Sidebar activeNav={activeNav} onNavChange={setActiveNav} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Loading conversation...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!conversationData) {
    return (
      <div className="flex h-screen" data-testid="conversation-page">
        <Sidebar activeNav={activeNav} onNavChange={setActiveNav} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-slate-600 mb-4">Conversation not found</p>
            <Button onClick={() => setLocation('/')}>
              Go Home
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const { conversation, messages } = conversationData;

  return (
    <div className="flex h-screen" data-testid="conversation-page">
      <Sidebar activeNav={activeNav} onNavChange={setActiveNav} />
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="font-semibold text-slate-800 text-[16px]" data-testid="conversation-title">
                  {conversation.title}
                </h1>
                <p className="text-slate-500 text-[13px]">
                  Started {new Date(conversation.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline"
                size="sm"
                onClick={handleDeleteConversation}
                disabled={deleteConversationMutation.isPending}
                className="text-red-600 border-red-200 hover:bg-red-50"
                data-testid="button-delete-conversation"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
              <Button 
                className="bg-slate-800 hover:bg-slate-700 text-white"
                onClick={() => setLocation('/')}
                data-testid="button-new-chat"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                New Chat
              </Button>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start space-x-4 ${
                  msg.role === 'user' ? 'justify-end' : ''
                }`}
                data-testid={`message-${msg.role}-${msg.id}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ml-[-6px] mr-[-6px] bg-[#1f61f0] pl-[0px] pr-[0px] pt-[0px] pb-[0px]">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}
                <div
                  className="max-w-3xl p-4 rounded-xl ml-[8px] mr-[8px] text-[#424242] mt-[-3px] mb-[-3px] pl-[25px] pr-[25px] bg-[#8493ba38] pt-[20px] pb-[20px]"
                >
                  <MarkdownRenderer content={msg.content} />
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0 ml-[6px] mr-[6px] pt-[0px] pb-[0px] mt-[6px] mb-[6px]">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            ))}

            {/* Streaming message */}
            {isStreaming && streamingMessage && (
              <div className="flex items-start space-x-4" data-testid="streaming-message">
                <div className="w-8 h-8 bg-brand-blue rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="max-w-3xl p-4 rounded-xl bg-slate-100 text-slate-800">
                  <MarkdownRenderer content={streamingMessage} />
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="w-2 h-2 bg-brand-blue rounded-full animate-pulse" />
                    <p className="text-xs text-slate-500">AI is typing...</p>
                  </div>
                </div>
              </div>
            )}

            {/* Loading indicator for initial streaming */}
            {((isStreaming && !streamingMessage) || shouldShowInitialStreaming) && (
              <div className="flex items-start space-x-4" data-testid="loading-message">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ml-[-6px] mr-[-6px] bg-[#1f61f0] pl-[0px] pr-[0px] pt-[0px] pb-[0px]">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="max-w-3xl p-4 rounded-xl ml-[8px] mr-[8px] text-[#424242] mt-[-3px] mb-[-3px] pl-[25px] pr-[25px] bg-[#8493ba38] pt-[20px] pb-[20px]">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-[#1f61f0] rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-[#1f61f0] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-[#1f61f0] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <span className="text-sm text-slate-600 ml-2">AI is thinking...</span>
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
        />
      </main>
    </div>
  );
}