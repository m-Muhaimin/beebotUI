import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/sidebar";
import InputSection from "@/components/input-section";
import { Button } from "@/components/ui/button";
import { PlusIcon, Lightbulb, BarChart, BookOpen, Code } from "lucide-react";

export default function Home() {
  const [activeNav, setActiveNav] = useState("home");
  const [message, setMessage] = useState("");
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const startNewChat = async (initialMessage: string) => {
    if (!initialMessage.trim() || isStartingChat) return;

    setIsStartingChat(true);

    try {
      const response = await fetch('/api/chat/new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: initialMessage }),
      });

      if (!response.ok) {
        throw new Error('Failed to start chat');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response reader');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let conversationId = '';

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
              
              if (data.conversationId) {
                conversationId = data.conversationId;
              }
              
              if (data.error) {
                toast({
                  title: "Error",
                  description: data.error,
                  variant: "destructive",
                });
                return;
              }
              
              if (data.finished && conversationId) {
                setLocation(`/conversation/${conversationId}`);
                return;
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
        description: "Failed to start new chat",
        variant: "destructive",
      });
    } finally {
      setIsStartingChat(false);
    }
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      startNewChat(message);
      setMessage("");
    }
  };

  const handleQuickAction = (action: string) => {
    let prompt = "";
    switch (action) {
      case "reasoning":
        prompt = "Help me reason through: ";
        break;
      case "create-image":
        prompt = "Create an image of: ";
        break;
      case "deep-research":
        prompt = "Research in detail: ";
        break;
    }
    setMessage(prompt);
  };

  const handlePromptClick = (promptText: string) => {
    startNewChat(promptText);
  };

  const suggestedPrompts = [
    {
      icon: Lightbulb,
      title: "Creative Writing",
      description: "Help me write a story, poem, or creative content",
      color: "blue"
    },
    {
      icon: BarChart,
      title: "Data Analysis",
      description: "Analyze data, create charts, or explain trends",
      color: "green"
    },
    {
      icon: BookOpen,
      title: "Learning & Research",
      description: "Explain concepts, research topics, or help study",
      color: "purple"
    },
    {
      icon: Code,
      title: "Code & Programming",
      description: "Write code, debug issues, or explain programming",
      color: "orange"
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "bg-blue-50 group-hover:bg-blue-100 text-blue-600",
      green: "bg-green-50 group-hover:bg-green-100 text-green-600",
      purple: "bg-purple-50 group-hover:bg-purple-100 text-purple-600",
      orange: "bg-orange-50 group-hover:bg-orange-100 text-orange-600"
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="flex h-screen" data-testid="home-page">
      <Sidebar activeNav={activeNav} onNavChange={setActiveNav} />
      
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl font-semibold text-slate-800" data-testid="greeting">
                  {getGreeting()}, Judha
                </h1>
                <p className="text-lg text-brand-blue font-medium mt-1">
                  How Can I Assist You Today?
                </p>
              </div>
            </div>
            <Button 
              className="bg-slate-800 hover:bg-slate-700 text-white"
              data-testid="button-new-chat"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              New Chat
            </Button>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 px-8 py-8 overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            {/* Welcome Message */}
            <div className="text-center mb-12">
              <div className="w-20 h-20 brand-gradient rounded-full mx-auto mb-6 flex items-center justify-center opacity-10">
                <svg className="w-10 h-10 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-slate-600 text-lg max-w-md mx-auto">
                Start a conversation by typing a message or try one of the quick actions below.
              </p>
            </div>

            {/* Suggested Prompts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {suggestedPrompts.map((prompt, index) => {
                const Icon = prompt.icon;
                return (
                  <button
                    key={index}
                    onClick={() => handlePromptClick(prompt.description)}
                    disabled={isStartingChat}
                    className="text-left p-6 bg-white border border-slate-200 rounded-xl hover:border-brand-blue hover:shadow-md transition-all duration-150 group disabled:opacity-50 disabled:cursor-not-allowed"
                    data-testid={`button-prompt-${prompt.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-150 ${getColorClasses(prompt.color)}`}>
                        {isStartingChat ? (
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Icon className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-800 mb-1">{prompt.title}</h3>
                        <p className="text-sm text-slate-600">{prompt.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <InputSection 
          message={message}
          onMessageChange={setMessage}
          onSendMessage={handleSendMessage}
          onQuickAction={handleQuickAction}
          disabled={isStartingChat}
        />
      </main>
    </div>
  );
}
