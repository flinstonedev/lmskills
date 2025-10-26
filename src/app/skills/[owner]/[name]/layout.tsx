import { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { generateSkillMetadata, generateSkillJsonLd } from "@/lib/seo";
import Script from "next/script";

interface SkillLayoutProps {
  params: Promise<{
    owner: string;
    name: string;
  }>;
  children: React.ReactNode;
}

export async function generateMetadata({
  params,
}: SkillLayoutProps): Promise<Metadata> {
  try {
    const { owner, name } = await params;
    const skill = await fetchQuery(api.skills.getSkill, {
      owner,
      name,
    });

    if (!skill) {
      return {
        title: "Skill Not Found",
        description: "The requested clade skill could not be found.",
      };
    }

    return generateSkillMetadata({
      skillName: skill.name,
      description: skill.description,
      ownerHandle: skill.owner.handle,
      updatedAt: skill.updatedAt,
    });
  } catch (error) {
    return {
      title: "Error Loading Skill",
      description: "An error occurred while loading this clade skill.",
    };
  }
}

export default async function SkillLayout({ params, children }: SkillLayoutProps) {
  let skillJsonLd = null;

  try {
    const { owner, name } = await params;
    const skill = await fetchQuery(api.skills.getSkill, {
      owner,
      name,
    });

    if (skill) {
      skillJsonLd = generateSkillJsonLd({
        name: skill.name,
        description: skill.description,
        author: {
          name: skill.owner.handle,
          url: `https://lmskills.com/users/${skill.owner.handle}`,
        },
        datePublished: skill.createdAt,
        dateModified: skill.updatedAt,
        url: `/skills/${owner}/${name}`,
      });
    }
  } catch (error) {
    console.error("Error generating JSON-LD:", error);
  }

  return (
    <>
      {skillJsonLd && (
        <Script
          id="skill-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(skillJsonLd),
          }}
        />
      )}
      {children}
    </>
  );
}
