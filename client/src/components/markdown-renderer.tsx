import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
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

  const htmlContent = parseMarkdown(content);
  
  // Wrap in paragraph tags if not already structured
  const wrappedContent = htmlContent.startsWith('<h') || htmlContent.startsWith('<li') || htmlContent.startsWith('<pre')
    ? htmlContent
    : `<p class="mb-3 text-slate-700 leading-relaxed">${htmlContent}</p>`;

  return (
    <div 
      className={`prose prose-sm max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: wrappedContent }}
    />
  );
}