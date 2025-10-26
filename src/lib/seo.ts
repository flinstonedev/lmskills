import { Metadata } from "next";

export const siteConfig = {
  name: "LMSkills",
  description:
    "Discover and share clade skills for Claude AI. Browse the largest directory of Claude skills, custom agents, and LLM capabilities.",
  url: "https://lmskills.com",
  ogImage: "/og-image.png",
  links: {
    twitter: "@lmskills",
  },
};

interface GenerateMetadataParams {
  title: string;
  description: string;
  image?: string;
  url?: string;
  keywords?: string[];
  type?: "website" | "article";
  noIndex?: boolean;
}

export function generateMetadata({
  title,
  description,
  image = siteConfig.ogImage,
  url,
  keywords,
  type = "website",
  noIndex = false,
}: GenerateMetadataParams): Metadata {
  const fullTitle = `${title} | ${siteConfig.name}`;
  const canonical = url ? `${siteConfig.url}${url}` : undefined;

  return {
    title,
    description,
    ...(keywords && keywords.length > 0 && { keywords }),
    openGraph: {
      type,
      locale: "en_US",
      url: canonical,
      siteName: siteConfig.name,
      title: fullTitle,
      description,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image],
      creator: siteConfig.links.twitter,
    },
    ...(canonical && {
      alternates: {
        canonical,
      },
    }),
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

interface GenerateSkillMetadataParams {
  skillName: string;
  description: string;
  ownerHandle: string;
  updatedAt?: number;
}

export function generateSkillMetadata({
  skillName,
  description,
  ownerHandle,
  updatedAt,
}: GenerateSkillMetadataParams): Metadata {
  const title = `${skillName} - Clade Skill by ${ownerHandle}`;
  const truncatedDescription = description.slice(0, 160);

  return generateMetadata({
    title,
    description: truncatedDescription,
    url: `/skills/${ownerHandle}/${skillName}`,
    keywords: [
      "clade skills",
      `${skillName}`,
      "Claude AI",
      "Claude skill",
      ownerHandle,
      "LLM capability",
    ],
    type: "article",
  });
}

interface GenerateUserMetadataParams {
  handle: string;
  skillCount?: number;
}

export function generateUserMetadata({
  handle,
  skillCount = 0,
}: GenerateUserMetadataParams): Metadata {
  const title = `${handle}'s Profile - Clade Skills Creator`;
  const description = `View ${handle}'s profile and discover their ${skillCount} Claude skills and clade contributions to the LMSkills community.`;

  return generateMetadata({
    title,
    description,
    url: `/users/${handle}`,
    keywords: [
      "clade skills creator",
      handle,
      "Claude skills developer",
      "LLM skills author",
    ],
  });
}

interface SkillJsonLd {
  name: string;
  description: string;
  author: {
    name: string;
    url?: string;
  };
  datePublished?: number;
  dateModified?: number;
  url: string;
}

export function generateSkillJsonLd({
  name,
  description,
  author,
  datePublished,
  dateModified,
  url,
}: SkillJsonLd) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    description,
    applicationCategory: "AI Tool",
    operatingSystem: "Web",
    author: {
      "@type": "Person",
      name: author.name,
      ...(author.url && { url: author.url }),
    },
    ...(datePublished && { datePublished: new Date(datePublished).toISOString() }),
    ...(dateModified && { dateModified: new Date(dateModified).toISOString() }),
    url: `${siteConfig.url}${url}`,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
}
