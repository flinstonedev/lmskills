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

  const urlTransform = (url: string, key?: string) => {
    // Block dangerous protocols (e.g. javascript:) that can appear in Markdown links.
    const trimmed = (url || "").trim();
    if (!trimmed) return "";

    // Allow in-page anchors and relative URLs, but never allow protocol-relative URLs.
    if (trimmed.startsWith("#")) return trimmed;
    if (trimmed.startsWith("//")) return "";
    if (
      trimmed.startsWith("/") ||
      trimmed.startsWith("./") ||
      trimmed.startsWith("../")
    ) {
      return trimmed;
    }

    try {
      const parsed = new URL(trimmed);
      const protocol = parsed.protocol.toLowerCase();

      // react-markdown calls urlTransform for both href and src.
      if (key === "href") {
        if (protocol === "http:" || protocol === "https:" || protocol === "mailto:") {
          return trimmed;
        }
        return "";
      }

      if (key === "src") {
        if (protocol === "http:" || protocol === "https:" || protocol === "data:") {
          return trimmed;
        }
        return "";
      }

      // Fallback: be conservative.
      if (protocol === "http:" || protocol === "https:") return trimmed;
      return "";
    } catch {
      // If URL parsing fails, strip it.
      return "";
    }
  };

  return (
    <div className={className}>
      <ReactMarkdown
        skipHtml
        urlTransform={urlTransform}
        components={{
          // Style links to open in new tab
          a: (props) => (
            <a
              {...props}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            />
          ),
          // Style code blocks
          code: ({ className, children, ...props }) => {
            const isInline = !className;
            return isInline ? (
              <code
                className="bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded text-sm font-mono border border-border"
                {...props}
              >
                {children}
              </code>
            ) : (
              <code
                className={`block bg-secondary text-secondary-foreground p-4 rounded-lg overflow-x-auto text-sm font-mono border border-border ${className || ""}`}
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
