import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Lightbulb, Globe, Search, Send, X, Square, Plus, FileText, Camera, Archive, Image, BarChart } from "lucide-react";

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
    { id: 'reasoning', label: 'Reasoning', icon: Lightbulb, description: 'Pure AI reasoning without tools' },
    { id: 'read-url', label: 'Read URL', icon: FileText, description: 'Extract content from web pages using Jina AI' },
    { id: 'screenshot', label: 'Screenshot', icon: Camera, description: 'Capture webpage screenshots using Jina AI' },
    { id: 'search-jina', label: 'Web Search', icon: Globe, description: 'Search web with Jina AI' },
    { id: 'search-arxiv', label: 'arXiv Search', icon: Archive, description: 'Search academic papers on arXiv' },
    { id: 'search-image', label: 'Image Search', icon: Image, description: 'Search for images using Jina AI' },
    { id: 'rerank', label: 'Rerank Results', icon: BarChart, description: 'Rerank documents by relevance using Jina AI' }
  ];

  const handleToolSelect = (toolId: string) => {
    const newTool = localSelectedTool === toolId ? null : toolId;
    setLocalSelectedTool(newTool);
    onToolChange?.(newTool);
    onQuickAction(toolId);
  };

  return (
    <div className="bg-background dark:bg-background border-t border-border p-6 pt-[16px] pb-[16px]" data-testid="input-section">
      <div className="max-w-4xl mx-auto">
        <div className="relative">
          <Textarea
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            rows={3}
            placeholder="Initiate a query or send a command to the AI..."
            disabled={disabled}
            className="flex min-h-[80px] bg-background dark:bg-background px-3 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm w-full py-4 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none text-foreground dark:text-foreground placeholder:text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed pt-[30px] pb-[30px] pl-[20px] pr-[20px] mt-[0px] mb-[0px]"
            data-testid="textarea-message"
          />
          
          {/* Tool Selection Dropdown Inside Input */}
          <div className="absolute bottom-3 left-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  className="h-8 w-8 p-0 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="tool-dropdown-trigger"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                {tools.map((tool) => {
                  const Icon = tool.icon;
                  const isSelected = (onToolChange ? localSelectedTool : selectedTool) === tool.id;
                  return (
                    <DropdownMenuItem
                      key={tool.id}
                      onClick={() => handleToolSelect(tool.id)}
                      className={`flex items-start gap-3 px-3 py-2 cursor-pointer ${
                        isSelected ? 'bg-primary/10 text-primary' : ''
                      }`}
                      data-testid={`tool-${tool.id}`}
                    >
                      <Icon className={`w-4 h-4 mt-0.5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div className="flex-1">
                        <div className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                          {tool.label}
                          {isSelected && <span className="ml-2 text-primary">✓</span>}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">{tool.description}</div>
                      </div>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Button
            onClick={isStreaming ? onStopStreaming : onSendMessage}
            size="sm"
            disabled={(!isStreaming && (disabled || !message.trim())) || (isStreaming && !onStopStreaming)}
            className={`inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 absolute right-3 bottom-3 w-8 h-8 p-0 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed pl-[25px] pr-[25px] pt-[20px] pb-[20px] ${
              isStreaming 
                ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" 
                : "bg-primary hover:bg-primary/90 text-primary-foreground"
            }`}
            aria-label={isStreaming ? "Stop generation" : "Send message"}
            data-testid={isStreaming ? "button-stop" : "button-send"}
          >
            {disabled && !isStreaming ? (
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : isStreaming ? (
              <Square className="w-4 h-4" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Keyboard Shortcut Hint */}
        <div className="flex justify-end mt-[3px] mb-[3px] pt-[5px] pb-[5px]">
          <div className="text-xs text-muted-foreground">
            Press <kbd className="px-2 py-1 bg-muted rounded text-muted-foreground">⌘</kbd> + <kbd className="px-2 py-1 bg-muted rounded text-muted-foreground">Enter</kbd> to send
          </div>
        </div>
      </div>
    </div>
  );
}
