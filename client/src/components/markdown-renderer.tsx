import React from "react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({
  content,
  className = "",
}: MarkdownRendererProps) {
  // Group content by Results if present
  const groupByResults = (text: string): string => {
    // Check if the content contains Result patterns
    const resultPattern =
      /(?:^|\n)(Result\s+\d+:?)\s*([\s\S]*?)(?=(?:\n|^)Result\s+\d+:?|$)/gi;
    const matches = Array.from(text.matchAll(resultPattern));

    if (matches.length > 0) {
      // Content has results, group them
      let groupedContent = "";

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
          <div class="result-group mb-6 p-4 border border-border rounded-lg bg-card dark:bg-card">
            <div class="result-header mb-3 pb-2 border-b border-border">
              <h3 class="text-lg font-semibold text-primary flex items-center">
                <span class="bg-primary/10 text-primary text-sm font-medium px-2.5 py-0.5 rounded-full mr-3">
                  ${index + 1}
                </span>
                ${resultTitle}
              </h3>
            </div>
            <div class="result-content text-foreground">
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
    return (
      text
        // Headers
        .replace(
          /^### (.*$)/gm,
          '<h3 class="text-lg font-semibold mb-3 mt-4 text-foreground dark:text-foreground">$1</h3>',
        )
        .replace(
          /^## (.*$)/gm,
          '<h2 class="text-xl font-semibold mb-3 mt-5 text-foreground dark:text-foreground">$1</h2>',
        )
        .replace(
          /^# (.*$)/gm,
          '<h1 class="text-2xl font-bold mb-4 mt-6 text-foreground dark:text-foreground">$1</h1>',
        )

        // Bold text
        .replace(
          /\*\*(.*?)\*\*/g,
          '<strong class="font-semibold text-foreground dark:text-foreground">$1</strong>',
        )

        // Italic text
        .replace(/\*(.*?)\*/g, '<em class="italic text-muted-foreground dark:text-muted-foreground">$1</em>')

        // Code blocks
        .replace(
          /```([\s\S]*?)```/g,
          '<pre class="bg-muted border border-border rounded-lg p-4 my-4 overflow-x-auto dark:bg-muted dark:border-border"><code class="text-sm text-foreground font-mono dark:text-foreground">$1</code></pre>',
        )

        // Inline code
        .replace(
          /`(.*?)`/g,
          '<code class="bg-muted text-foreground px-2 py-1 rounded text-sm font-mono dark:bg-muted dark:text-foreground">$1</code>',
        )

        // Bullet points
        .replace(/^- (.*$)/gm, '<li class="ml-4 mb-1 text-foreground dark:text-foreground">• $1</li>')

        // Numbered lists
        .replace(
          /^(\d+)\. (.*$)/gm,
          '<li class="ml-4 mb-1 text-foreground dark:text-foreground">$1. $2</li>',
        )

        // Line breaks
        .replace(/\n\n/g, '</p><p class="mb-3 text-foreground leading-relaxed dark:text-foreground">')
        .replace(/\n/g, "<br />")
    );
  };

  const processedContent = groupByResults(content);

  // Wrap in paragraph tags if not already structured and not grouped by results
  const wrappedContent =
    processedContent.includes("result-group") ||
    processedContent.startsWith("<h") ||
    processedContent.startsWith("<li") ||
    processedContent.startsWith("<pre") ||
    processedContent.startsWith("<div")
      ? processedContent
      : `<p class="mb-2 leading-relaxed text-foreground dark:text-foreground">${processedContent}</p>`;

  return (
    <div
      className={`prose prose-sm max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: wrappedContent }}
    />
  );
}
