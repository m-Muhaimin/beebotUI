import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Lightbulb, Globe, Search, Send, X, Square } from "lucide-react";

interface InputSectionProps {
  message: string;
  onMessageChange: (message: string) => void;
  onSendMessage: () => void;
  onQuickAction: (action: string) => void;
  disabled?: boolean;
  selectedTool?: string | null;
  onToolChange?: (tool: string | null) => void;
  isStreaming?: boolean;
  onStopStreaming?: () => void;
}

export default function InputSection({ 
  message, 
  onMessageChange, 
  onSendMessage, 
  onQuickAction,
  disabled = false,
  selectedTool = null,
  onToolChange,
  isStreaming = false,
  onStopStreaming
}: InputSectionProps) {
  const [localSelectedTool, setLocalSelectedTool] = useState<string | null>(selectedTool);
  
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
    const newTool = localSelectedTool === toolId ? null : toolId;
    setLocalSelectedTool(newTool);
    onToolChange?.(newTool);
    onQuickAction(toolId);
  };

  return (
    <div className="bg-white border-t border-slate-200 p-6 pt-[16px] pb-[16px]" data-testid="input-section">
      <div className="max-w-4xl mx-auto">
        <div className="relative">
          <Textarea
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            rows={3}
            placeholder="Initiate a query or send a command to the AI..."
            disabled={disabled}
            className="flex min-h-[80px] bg-background px-3 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm w-full py-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent resize-none text-slate-800 placeholder-slate-500 disabled:opacity-50 disabled:cursor-not-allowed pt-[30px] pb-[30px] pl-[20px] pr-[20px] mt-[0px] mb-[0px]"
            data-testid="textarea-message"
          />
          
          {/* Tool Selection Inside Input */}
          <div className="absolute bottom-3 left-4 flex items-center space-x-2">
            {tools.map((tool) => {
              const Icon = tool.icon;
              const isSelected = (onToolChange ? localSelectedTool : selectedTool) === tool.id;
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
            onClick={isStreaming ? onStopStreaming : onSendMessage}
            size="sm"
            disabled={(!isStreaming && (disabled || !message.trim())) || (isStreaming && !onStopStreaming)}
            className={`inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 absolute right-3 bottom-3 w-8 h-8 p-0 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed pl-[25px] pr-[25px] pt-[20px] pb-[20px] ${
              isStreaming 
                ? "bg-red-500 hover:bg-red-600 text-white" 
                : "bg-brand-blue hover:bg-blue-600 text-white"
            }`}
            aria-label={isStreaming ? "Stop generation" : "Send message"}
            data-testid={isStreaming ? "button-stop" : "button-send"}
          >
            {disabled && !isStreaming ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isStreaming ? (
              <Square className="w-4 h-4" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Keyboard Shortcut Hint */}
        <div className="flex justify-end mt-[3px] mb-[3px] pt-[5px] pb-[5px]">
          <div className="text-xs text-slate-500">
            Press <kbd className="px-2 py-1 bg-slate-100 rounded text-slate-600">⌘</kbd> + <kbd className="px-2 py-1 bg-slate-100 rounded text-slate-600">Enter</kbd> to send
          </div>
        </div>
      </div>
    </div>
  );
}
