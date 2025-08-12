import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  // Component for expandable search result cards
  const SearchResultCard = ({ title, content, index }: { title: string; content: string; index: number }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    return (
      <div className="mb-4 border border-slate-200 rounded-lg bg-slate-50/50 overflow-hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-slate-100/50 transition-colors"
        >
          <div className="flex items-center">
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full mr-3">
              {index}
            </span>
            <span className="font-medium text-slate-800">{title}</span>
          </div>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-slate-500" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-500" />
          )}
        </button>
        {isExpanded && (
          <div className="px-4 pb-4 border-t border-slate-200 bg-white">
            <div 
              className="prose prose-sm max-w-none mt-3"
              dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
            />
          </div>
        )}
      </div>
    );
  };

  // Detect and separate search results from AI response
  const parseSearchResults = (text: string) => {
    // First, try to detect a pattern where we have numbered search results followed by an AI summary
    // Look for sections that start with numbers (1., 2., etc.) and contain URLs/source information
    
    // Split content into lines for better analysis
    const lines = text.split('\n');
    const searchResults = [];
    let currentResult = null;
    let searchResultsEndIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if this line starts a new numbered result
      const numberedMatch = line.match(/^(\d+)\.\s*(.*)/);
      if (numberedMatch) {
        // Save previous result if exists
        if (currentResult) {
          searchResults.push(currentResult);
        }
        
        // Start new result
        currentResult = {
          title: numberedMatch[2].trim(),
          content: '',
          index: parseInt(numberedMatch[1])
        };
        continue;
      }
      
      // If we're currently building a search result, add content to it
      if (currentResult) {
        // Stop collecting content if we hit an empty line followed by a paragraph that looks like AI response
        if (line === '' && i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          // Check if next line starts an AI response (common patterns)
          if (nextLine.match(/^(Based on|After reviewing|Here's|The richest|According to)/i)) {
            searchResults.push(currentResult);
            searchResultsEndIndex = i;
            break;
          }
        }
        
        // Add line to current result content
        if (line) {
          currentResult.content += (currentResult.content ? '\n' : '') + line;
        }
      }
    }
    
    // Add the last result if we didn't find an AI response separator
    if (currentResult && searchResultsEndIndex === -1) {
      searchResults.push(currentResult);
      searchResultsEndIndex = lines.length;
    }
    
    // If we found search results, extract the AI response
    if (searchResults.length >= 2) {
      let aiResponse = '';
      
      if (searchResultsEndIndex > -1 && searchResultsEndIndex < lines.length - 1) {
        // Get everything after the search results
        aiResponse = lines.slice(searchResultsEndIndex + 1).join('\n').trim();
      }
      
      return {
        hasSearchResults: true,
        searchResults,
        aiResponse
      };
    }
    
    return {
      hasSearchResults: false,
      searchResults: [],
      aiResponse: text
    };
  };

  // Group content by Results if present (fallback for existing pattern)
  const groupByResults = (text: string): string => {
    // First check for search results pattern
    const searchData = parseSearchResults(text);
    
    if (searchData.hasSearchResults) {
      // Render with React components (will be handled in JSX return)
      return 'SEARCH_RESULTS_DETECTED';
    }
    
    // Check if the content contains Result patterns (existing logic)
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

  const searchData = parseSearchResults(content);
  
  // If we have search results, render with React components
  if (searchData.hasSearchResults) {
    return (
      <div className={`prose prose-sm max-w-none ${className}`}>
        {/* Search Results Section */}
        {searchData.searchResults.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 text-slate-800 flex items-center">
              <span className="bg-green-100 text-green-800 text-sm font-medium px-2.5 py-0.5 rounded-full mr-3">
                🔍
              </span>
              Search Results ({searchData.searchResults.length} found)
            </h3>
            {searchData.searchResults.map((result, index) => (
              <SearchResultCard
                key={index}
                title={result.title}
                content={result.content}
                index={result.index}
              />
            ))}
          </div>
        )}
        
        {/* AI Response Section */}
        {searchData.aiResponse && (
          <div className="mt-6">
            <div 
              dangerouslySetInnerHTML={{ 
                __html: searchData.aiResponse.includes('<') 
                  ? searchData.aiResponse 
                  : `<p class="mb-3 text-slate-700 leading-relaxed">${parseMarkdown(searchData.aiResponse)}</p>`
              }}
            />
          </div>
        )}
      </div>
    );
  }
  
  // Fallback to existing logic for other content types
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