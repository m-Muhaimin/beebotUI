import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
<<<<<<< HEAD
import { Lightbulb, Image, Search, Send } from "lucide-react";
=======
import { Lightbulb, Search, Send } from "lucide-react";
>>>>>>> 715dfa8 (Feature: Deep Search | Web Search)

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
            className="w-full pl-4 pr-12 py-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent resize-none text-slate-800 placeholder-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="textarea-message"
          />
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

        {/* Quick Action Buttons */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onQuickAction("reasoning")}
              disabled={disabled}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-reasoning"
            >
              <Lightbulb className="w-4 h-4" />
              <span>Reasoning</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
<<<<<<< HEAD
              onClick={() => onQuickAction("create-image")}
              disabled={disabled}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-create-image"
            >
              <Image className="w-4 h-4" />
              <span>Create Image</span>
=======
              onClick={() => onQuickAction("web-search")}
              disabled={disabled}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-web-search"
            >
              <Search className="w-4 h-4" />
              <span>Web Search</span>
>>>>>>> 715dfa8 (Feature: Deep Search | Web Search)
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onQuickAction("deep-research")}
              disabled={disabled}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-deep-research"
            >
              <Search className="w-4 h-4" />
              <span>Deep Research</span>
            </Button>
          </div>
          <div className="text-xs text-slate-500">
            Press <kbd className="px-2 py-1 bg-slate-100 rounded text-slate-600">⌘</kbd> + <kbd className="px-2 py-1 bg-slate-100 rounded text-slate-600">Enter</kbd> to send
          </div>
        </div>
      </div>
    </div>
  );
}
