import type { Metadata } from "next";

type Props = {
  params: Promise<{ owner: string; name: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { owner, name } = await params;

  // Decode URL-encoded names
  const decodedName = decodeURIComponent(name);
  const decodedOwner = decodeURIComponent(owner);

  return {
    title: `${decodedName} by ${decodedOwner}`,
    description: `View and explore the ${decodedName} skill created by ${decodedOwner}. Browse source code, documentation, and implementation details.`,
    openGraph: {
      title: `${decodedName} by ${decodedOwner} | LMSkills`,
      description: `View and explore the ${decodedName} skill created by ${decodedOwner}.`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${decodedName} by ${decodedOwner} | LMSkills`,
      description: `View and explore the ${decodedName} skill created by ${decodedOwner}.`,
    },
  };
}

export default function SkillLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
