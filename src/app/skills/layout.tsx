import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Skills",
  description:
    "Discover Claude skills shared by the community. Search, filter, and explore powerful LLM capabilities for your projects.",
  openGraph: {
    title: "Browse Skills | LMSkills",
    description:
      "Discover Claude skills shared by the community. Search, filter, and explore powerful LLM capabilities.",
  },
  twitter: {
    card: "summary",
    title: "Browse Skills | LMSkills",
    description:
      "Discover Claude skills shared by the community. Search, filter, and explore powerful LLM capabilities.",
  },
};

export default function SkillsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
