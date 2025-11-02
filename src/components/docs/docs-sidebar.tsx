"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";

interface DocSection {
  title: string;
  href?: string;
  items?: DocItem[];
}

interface DocItem {
  title: string;
  href: string;
}

const navigation: DocSection[] = [
  {
    title: "Getting Started",
    items: [
      { title: "Introduction", href: "/docs" },
      { title: "Quick Start", href: "/docs#quick-start" },
    ],
  },
  {
    title: "Skills",
    items: [
      { title: "Submitting Skills", href: "/docs#submitting-skills" },
      { title: "Using Skills", href: "/docs#using-skills" },
    ],
  },
  {
    title: "CLI Tool",
    items: [
      { title: "Overview", href: "/docs#cli-tool" },
    ],
  },
  {
    title: "Best Practices",
    items: [
      { title: "Overview", href: "/docs#best-practices" },
    ],
  },
  {
    title: "Reference",
    items: [
      { title: "API Reference", href: "/docs#api-reference" },
      { title: "FAQ", href: "/docs#faq" },
    ],
  },
];

export function DocsSidebar() {
  const pathname = usePathname();
  const [activeHash, setActiveHash] = useState("");
  const [openSections, setOpenSections] = useState<string[]>(
    navigation.map((section) => section.title)
  );

  // Track the current hash/anchor
  useEffect(() => {
    const updateHash = () => {
      setActiveHash(window.location.hash);
    };

    // Set initial hash
    updateHash();

    // Listen for hash changes and scroll events
    window.addEventListener("hashchange", updateHash);

    // Also update on scroll to detect which section is visible
    const handleScroll = () => {
      updateHash();
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("hashchange", updateHash);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const toggleSection = (title: string) => {
    setOpenSections((prev) =>
      prev.includes(title)
        ? prev.filter((t) => t !== title)
        : [...prev, title]
    );
  };

  const isLinkActive = (href: string) => {
    const fullPath = pathname + activeHash;

    // Direct match (e.g., /docs#quick-start matches /docs#quick-start)
    if (fullPath === href) {
      return true;
    }

    // Handle root /docs page - active only when no hash
    if (href === "/docs") {
      return pathname === "/docs" && activeHash === "";
    }

    return false;
  };

  const handleLinkClick = (href: string) => {
    // Immediately update the active hash when clicking
    if (href.includes("#")) {
      const hash = href.split("#")[1];
      setActiveHash(`#${hash}`);
    } else {
      setActiveHash("");
    }
  };

  return (
    <nav aria-label="Documentation navigation" className="space-y-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold px-3">Documentation</h2>
      </div>

      {navigation.map((section) => {
        const isOpen = openSections.includes(section.title);

        return (
          <div key={section.title} className="space-y-1">
            {section.items ? (
              <>
                <button
                  onClick={() => toggleSection(section.title)}
                  className={cn(
                    "flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md hover:bg-accent transition-colors",
                    "text-foreground"
                  )}
                >
                  <span>{section.title}</span>
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 transition-transform",
                      isOpen && "rotate-90"
                    )}
                  />
                </button>

                {isOpen && (
                  <div className="ml-3 space-y-1 border-l border-border pl-3">
                    {section.items.map((item) => {
                      const isActive = isLinkActive(item.href);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => handleLinkClick(item.href)}
                          className={cn(
                            "block px-3 py-2 text-sm rounded-md transition-colors",
                            isActive
                              ? "bg-accent text-accent-foreground font-medium"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                          )}
                        >
                          {item.title}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <Link
                href={section.href!}
                onClick={() => handleLinkClick(section.href!)}
                className={cn(
                  "block px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isLinkActive(section.href!)
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                {section.title}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
