import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submit a Skill",
  description:
    "Share your Claude skill with the community. Submit your GitHub repository URL and make your skill discoverable to others.",
  openGraph: {
    title: "Submit a Skill | LMSkills",
    description:
      "Share your Claude skill with the community. Submit your GitHub repository URL and make your skill discoverable to others.",
  },
  twitter: {
    card: "summary",
    title: "Submit a Skill | LMSkills",
    description:
      "Share your Claude skill with the community. Submit your GitHub repository URL and make your skill discoverable to others.",
  },
};

export default function SubmitSkillLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
