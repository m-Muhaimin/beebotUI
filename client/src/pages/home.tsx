import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useWelcome } from "@/hooks/useWelcome";
import Sidebar from "@/components/sidebar";
import InputSection from "@/components/input-section";
import { Button } from "@/components/ui/button";
import { PlusIcon, Lightbulb, BarChart, BookOpen, Code, HelpCircle } from "lucide-react";

export default function Home() {
  const [activeNav, setActiveNav] = useState("home");
  const [message, setMessage] = useState("");
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { resetWelcome } = useWelcome();

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
        body: JSON.stringify({ 
          message: initialMessage,
          selectedTool: selectedTool 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start chat');
      }

      const data = await response.json();
      
      if (data.conversationId) {
        // Navigate immediately to the conversation page
        setLocation(`/conversation/${data.conversationId}`);
      } else {
        throw new Error('No conversation ID received');
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
    // Tools are activated but don't modify the input field text
    // The tool selection will be handled visually through the UI state
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
        <header className="bg-white border-b border-slate-200 px-8 py-6 pt-[6px] pb-[6px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="font-semibold text-[15px] text-[#122557]" data-testid="greeting">
                  {getGreeting()}, {user?.firstName || user?.username || 'User'}
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                onClick={resetWelcome}
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-blue-600 p-2"
                data-testid="button-help"
              >
                <HelpCircle className="w-4 h-4" />
              </Button>
              <Button 
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 py-2 hover:bg-slate-700 font-normal text-[12px] pt-[8px] pb-[8px] pl-[21px] pr-[21px] bg-[#142236] text-[#fff2f2]"
                data-testid="button-new-chat"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                New Chat
              </Button>
            </div>
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

            </div>

            {/* Suggested Prompts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-[10px] mb-[10px]">
              {suggestedPrompts.map((prompt, index) => {
                const Icon = prompt.icon;
                return (
                  <button
                    key={index}
                    onClick={() => handlePromptClick(prompt.description)}
                    disabled={isStartingChat}
                    className="text-left p-6 bg-white border border-slate-200 rounded-xl hover:border-brand-blue hover:shadow-md transition-all duration-150 group disabled:opacity-50 disabled:cursor-not-allowed pl-[20px] pr-[20px] pt-[18px] pb-[18px]"
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
                        <h3 className="text-slate-800 text-[14px] font-semibold mt-[2px] mb-[2px]">{prompt.title}</h3>
                        <p className="text-slate-600 text-[13px]">{prompt.description}</p>
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
          selectedTool={selectedTool}
          onToolChange={setSelectedTool}
        />
      </main>
    </div>
  );
}
