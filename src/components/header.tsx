"use client";

import Link from "next/link";
import { SignInButton, SignUpButton, UserButton, SignedIn, SignedOut, useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sheet, SheetContent, SheetTitle, SheetTrigger, VisuallyHidden } from "@/components/ui/sheet";
import { Menu, User, Github, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { usePathname } from "next/navigation";

// Define public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/",
  "/docs",
  "/skills",
  "/users",
  "/terms",
  "/privacy",
];

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useAuth();
  
  // Check if current route is public
  const isPublicRoute = pathname !== "/skills/submit" && PUBLIC_ROUTES.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  // Fetch current user when signed in (even on public routes).
  const currentUser = useQuery(
    api.users.getCurrentUser,
    !isLoaded || !isSignedIn ? "skip" : undefined
  );

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          {/* Mobile Menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <VisuallyHidden>
                <SheetTitle>Navigation Menu</SheetTitle>
              </VisuallyHidden>
              <nav aria-label="Mobile navigation" className="flex flex-col space-y-4 mt-8">
                <Link
                  href="/skills"
                  className="text-lg font-medium hover:underline"
                  onClick={() => setOpen(false)}
                >
                  Browse Skills
                </Link>
                <Link
                  href="/docs"
                  className="text-lg font-medium hover:underline"
                  onClick={() => setOpen(false)}
                >
                  Docs
                </Link>
                {!isPublicRoute && (
                  <>
                    <SignedIn>
                      <Link
                        href="/dashboard"
                        className="text-lg font-medium hover:underline"
                        onClick={() => setOpen(false)}
                      >
                        My Skills
                      </Link>
                      <Link
                        href="/skills/submit"
                        className="text-lg font-medium hover:underline"
                        onClick={() => setOpen(false)}
                      >
                        Submit Skill
                      </Link>
                    </SignedIn>
                    <SignedOut>
                      <div className="flex flex-col space-y-2 pt-4 border-t">
                        <SignInButton mode="modal">
                          <Button variant="ghost" className="justify-start">Sign In</Button>
                        </SignInButton>
                        <SignUpButton mode="modal">
                          <Button className="justify-start">Sign Up</Button>
                        </SignUpButton>
                      </div>
                    </SignedOut>
                  </>
                )}
                {isPublicRoute && (
                  <div className="flex flex-col space-y-2 pt-4 border-t">
                    <Link href="/sign-in">
                      <Button variant="ghost" className="w-full justify-start">Sign In</Button>
                    </Link>
                    <Link href="/sign-up">
                      <Button className="w-full justify-start">Sign Up</Button>
                    </Link>
                  </div>
                )}
              </nav>
            </SheetContent>
          </Sheet>

          <Link href="/" className="text-2xl font-bold">
            LMSkills
          </Link>
          <nav className="hidden md:flex space-x-6">
            <Link href="/skills" className="text-sm font-medium hover:underline">
              Browse Skills
            </Link>
            <Link href="/docs" className="text-sm font-medium hover:underline">
              Docs
            </Link>
            {!isPublicRoute && (
              <SignedIn>
                <Link href="/dashboard" className="text-sm font-medium hover:underline">
                  My Skills
                </Link>
              </SignedIn>
            )}
          </nav>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          <Button asChild variant="ghost" size="icon" className="hidden sm:inline-flex">
            <a
              href="https://github.com/flinstonedev/lmskills"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View source on GitHub"
            >
              <Github className="h-5 w-5" />
            </a>
          </Button>
          <ThemeToggle />
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="ghost" className="hidden sm:inline-flex">Sign In</Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button className="hidden sm:inline-flex">Sign Up</Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Button asChild variant="default" className="hidden md:inline-flex">
              <Link href="/skills/submit">Submit Skill</Link>
            </Button>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-10 w-10",
                },
              }}
            >
              <UserButton.MenuItems>
                <UserButton.Link
                  label="My Skills"
                  labelIcon={<LayoutDashboard className="h-4 w-4" />}
                  href="/dashboard"
                />
                <UserButton.Link
                  label="My Profile"
                  labelIcon={<User className="h-4 w-4" />}
                  href={currentUser?.handle ? `/users/${currentUser.handle}` : "/dashboard"}
                />
              </UserButton.MenuItems>
            </UserButton>
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
