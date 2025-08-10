import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function ConversationHistory() {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    tomorrow: true,
    week: true,
  });

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const historyData = {
    tomorrow: [
      "What's something you've learned recently?",
      "If you could teleport anywhere right now...",
      "What's one goal you want to achieve?"
    ],
    week: [
      "Ask me anything weird or random",
      "How are you feeling today, really?",
      "What's one habit you wish you had?"
    ]
  };

  return (
    <div className="mt-8" data-testid="conversation-history">
      {/* Tomorrow Section */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection("tomorrow")}
          className="flex items-center justify-between w-full text-left text-xs font-medium text-slate-500 uppercase tracking-wider mb-3 hover:text-slate-700 transition-colors duration-150"
          data-testid="button-toggle-tomorrow"
        >
          <span>Tomorrow</span>
          <ChevronDown 
            className={`w-4 h-4 transform transition-transform duration-150 ${
              expandedSections.tomorrow ? "rotate-0" : "-rotate-90"
            }`} 
          />
        </button>
        {expandedSections.tomorrow && (
          <div className="space-y-2" data-testid="section-tomorrow">
            {historyData.tomorrow.map((prompt, index) => (
              <button
                key={index}
                className="w-full text-left p-3 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors duration-150 border border-transparent hover:border-slate-200"
                data-testid={`button-history-prompt-tomorrow-${index}`}
              >
                {prompt}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Week Section */}
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
            {historyData.week.map((prompt, index) => (
              <button
                key={index}
                className="w-full text-left p-3 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors duration-150 border border-transparent hover:border-slate-200"
                data-testid={`button-history-prompt-week-${index}`}
              >
                {prompt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
