import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Lightbulb, Globe, Search, Send, X } from "lucide-react";

interface InputSectionProps {
  message: string;
  onMessageChange: (message: string) => void;
  onSendMessage: () => void;
  onQuickAction: (action: string) => void;
  disabled?: boolean;
}

export default function InputSection({ 
  message, 
  onMessageChange, 
  onSendMessage, 
  onQuickAction,
  disabled = false
}: InputSectionProps) {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        onSendMessage();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onSendMessage]);

  const tools = [
    { id: 'reasoning', label: 'Reasoning', icon: Lightbulb },
    { id: 'web-search', label: 'Web Search', icon: Globe },
    { id: 'deep-research', label: 'Deep Research', icon: Search }
  ];

  const handleToolSelect = (toolId: string) => {
    if (selectedTool === toolId) {
      setSelectedTool(null);
    } else {
      setSelectedTool(toolId);
      onQuickAction(toolId);
    }
  };

  return (
    <div className="bg-white border-t border-slate-200 p-6" data-testid="input-section">
      <div className="max-w-4xl mx-auto">
        <div className="relative">
          <Textarea
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            rows={3}
            placeholder="Initiate a query or send a command to the AI..."
            disabled={disabled}
            className="w-full pl-4 pr-12 pb-12 py-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent resize-none text-slate-800 placeholder-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="textarea-message"
          />
          
          {/* Tool Selection Inside Input */}
          <div className="absolute bottom-3 left-4 flex items-center space-x-2">
            {tools.map((tool) => {
              const Icon = tool.icon;
              const isSelected = selectedTool === tool.id;
              return (
                <Button
                  key={tool.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToolSelect(tool.id)}
                  disabled={disabled}
                  className="justify-center gap-2 whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-9 flex items-center space-x-1 px-2 py-1 text-xs rounded-md transition-colors text-slate-500 hover:text-slate-700 hover:bg-slate-100 font-normal text-center bg-[#d1deeb59] pt-[0px] pb-[0px] pl-[14px] pr-[14px] ml-[4px] mr-[4px]"
                  data-testid={`tool-${tool.id}`}
                >
                  <Icon className="w-3 h-3" />
                  <span className="ml-[-3px] mr-[-3px]">{tool.label}</span>
                  {isSelected && <X className="w-3 h-3 ml-1" />}
                </Button>
              );
            })}
          </div>
          <Button
            onClick={onSendMessage}
            size="sm"
            disabled={disabled || !message.trim()}
            className="absolute right-3 bottom-3 w-8 h-8 p-0 bg-brand-blue hover:bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send message"
            data-testid="button-send"
          >
            {disabled ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Keyboard Shortcut Hint */}
        <div className="flex justify-end mt-2">
          <div className="text-xs text-slate-500">
            Press <kbd className="px-2 py-1 bg-slate-100 rounded text-slate-600">⌘</kbd> + <kbd className="px-2 py-1 bg-slate-100 rounded text-slate-600">Enter</kbd> to send
          </div>
        </div>
      </div>
    </div>
  );
}
