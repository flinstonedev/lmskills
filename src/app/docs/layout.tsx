import { DocsSidebar } from "@/components/docs/docs-sidebar";
import { DocsMobileNav } from "@/components/docs/docs-mobile-nav";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="container mx-auto px-4">
        <div className="flex gap-8 lg:gap-12">
          {/* Sidebar */}
          <aside className="hidden md:block w-64 lg:w-72 flex-shrink-0">
            <div className="sticky top-20 py-8">
              <DocsSidebar />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 py-8 min-w-0">
            <div className="max-w-3xl">
              {children}
            </div>
          </main>

          {/* Table of Contents (Right Sidebar) - Optional for future */}
          <aside className="hidden xl:block w-64 flex-shrink-0">
            <div className="sticky top-20 py-8">
              {/* Placeholder for table of contents */}
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile Navigation */}
      <DocsMobileNav />
    </>
  );
}
