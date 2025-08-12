import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  // Group content by Results if present
  const groupByResults = (text: string): string => {
    // Check if the content contains Result patterns
    const resultPattern = /(?:^|\n)(Result\s+\d+:?)\s*([\s\S]*?)(?=(?:\n|^)Result\s+\d+:?|$)/gi;
    const matches = Array.from(text.matchAll(resultPattern));
    
    if (matches.length > 0) {
      // Content has results, group them
      let groupedContent = '';
      
      // Add any content before the first result
      const firstResultIndex = text.search(/(?:^|\n)Result\s+\d+:?/i);
      if (firstResultIndex > 0) {
        const preContent = text.substring(0, firstResultIndex).trim();
        if (preContent) {
          groupedContent += `<div class="mb-6">${parseMarkdown(preContent)}</div>`;
        }
      }
      
      // Process each result group
      matches.forEach((match, index) => {
        const resultTitle = match[1].trim();
        const resultContent = match[2].trim();
        
        groupedContent += `
          <div class="result-group mb-6 p-4 border border-slate-200 rounded-lg bg-slate-50/30">
            <div class="result-header mb-3 pb-2 border-b border-slate-200">
              <h3 class="text-lg font-semibold text-blue-700 flex items-center">
                <span class="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full mr-3">
                  ${index + 1}
                </span>
                ${resultTitle}
              </h3>
            </div>
            <div class="result-content">
              ${parseMarkdown(resultContent)}
            </div>
          </div>
        `;
      });
      
      return groupedContent;
    } else {
      // No results pattern found, use regular parsing
      return parseMarkdown(text);
    }
  };

  // Parse markdown-like content into HTML
  const parseMarkdown = (text: string): string => {
    return text
      // Headers
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mb-3 mt-4 text-slate-800">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mb-3 mt-5 text-slate-800">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mb-4 mt-6 text-slate-800">$1</h1>')
      
      // Bold text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-800">$1</strong>')
      
      // Italic text
      .replace(/\*(.*?)\*/g, '<em class="italic text-slate-700">$1</em>')
      
      // Code blocks
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-slate-100 border border-slate-200 rounded-lg p-4 my-4 overflow-x-auto"><code class="text-sm text-slate-800 font-mono">$1</code></pre>')
      
      // Inline code
      .replace(/`(.*?)`/g, '<code class="bg-slate-100 text-slate-800 px-2 py-1 rounded text-sm font-mono">$1</code>')
      
      // Bullet points
      .replace(/^- (.*$)/gm, '<li class="ml-4 mb-1 text-slate-700">• $1</li>')
      
      // Numbered lists
      .replace(/^(\d+)\. (.*$)/gm, '<li class="ml-4 mb-1 text-slate-700">$1. $2</li>')
      
      // Line breaks
      .replace(/\n\n/g, '</p><p class="mb-3 text-slate-700 leading-relaxed">')
      .replace(/\n/g, '<br />');
  };

  const processedContent = groupByResults(content);
  
  // Wrap in paragraph tags if not already structured and not grouped by results
  const wrappedContent = processedContent.includes('result-group') || 
                         processedContent.startsWith('<h') || 
                         processedContent.startsWith('<li') || 
                         processedContent.startsWith('<pre') || 
                         processedContent.startsWith('<div')
    ? processedContent
    : `<p class="mb-3 text-slate-700 leading-relaxed">${processedContent}</p>`;

  return (
    <div 
      className={`prose prose-sm max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: wrappedContent }}
    />
  );
}