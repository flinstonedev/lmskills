"use client";

import ReactMarkdown from "react-markdown";
import DOMPurify from "dompurify";
import { useMemo } from "react";

interface SafeMarkdownProps {
  content: string;
  className?: string;
}

/**
 * Safe markdown renderer that sanitizes HTML to prevent XSS attacks
 * Uses DOMPurify to clean any potentially malicious content
 */
export function SafeMarkdown({ content, className }: SafeMarkdownProps) {
  const sanitizedContent = useMemo(() => {
    // Configure DOMPurify to be strict
    const config = {
      ALLOWED_TAGS: [
        "h1", "h2", "h3", "h4", "h5", "h6",
        "p", "br", "hr",
        "strong", "em", "u", "s", "code", "pre",
        "ul", "ol", "li",
        "blockquote",
        "a",
        "img",
        "table", "thead", "tbody", "tr", "th", "td",
      ],
      ALLOWED_ATTR: [
        "href", "title", "src", "alt", "class",
      ],
      ALLOW_DATA_ATTR: false,
    };

    return DOMPurify.sanitize(content, config);
  }, [content]);

  return (
    <div className={className}>
      <ReactMarkdown
        components={{
          // Style links to open in new tab
          a: ({ node, ...props }) => (
            <a
              {...props}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            />
          ),
          // Style code blocks
          code: ({ node, className, children, ...props }) => {
            const isInline = !className;
            return isInline ? (
              <code
                className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
                {...props}
              >
                {children}
              </code>
            ) : (
              <code
                className={`block bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono ${className || ""}`}
                {...props}
              >
                {children}
              </code>
            );
          },
        }}
      >
        {sanitizedContent}
      </ReactMarkdown>
    </div>
  );
}
