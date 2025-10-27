import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Create Convex client
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    // Fetch all skills - collect all pages
    let allSkills: any[] = [];
    let cursor: string | null = null;
    let isDone = false;

    while (!isDone) {
      const result: any = await convex.query(api.skills.listSkills, {
        paginationOpts: {
          numItems: 100,
          cursor: cursor,
        },
      });

      allSkills = allSkills.concat(result.page);
      isDone = result.isDone;
      cursor = result.continueCursor || null;
    }

    const skills = allSkills;

    // Build llms.txt content
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://lmskills.ai";

    let content = `# LMSkills - LLM Skills Directory

> A public, LLM-agnostic platform for sharing, discovering, and collaborating on Claude skills and similar LLM-powered tools.

## Documentation

- Home: ${baseUrl}
- About: ${baseUrl}/docs/about
- Submit Skill: ${baseUrl}/skills/submit

## Skills Directory

This directory contains ${skills.length} publicly available LLM skills. Each skill includes:
- Complete skill documentation in Markdown format
- Installation and usage instructions
- Example prompts and configurations

### Available Skills

`;

    // Add each skill with its markdown URL
    for (const skill of skills) {
      const owner = skill.owner?.handle || "unknown";
      content += `
- ${skill.name}: ${baseUrl}/skills/${owner}/${skill.name}.md
  ${skill.description}
`;
    }

    content += `

## API Endpoints

### Skills API

Get skill metadata as JSON or Markdown:

- JSON: ${baseUrl}/api/skills/:owner/:name
- Markdown: ${baseUrl}/api/skills/:owner/:name (with Accept: text/markdown header)
- Markdown (direct): ${baseUrl}/skills/:owner/:name.md

### Content Negotiation

The API supports content negotiation via the Accept header:
- \`Accept: application/json\` - Returns JSON metadata
- \`Accept: text/markdown\` - Returns raw Markdown content

## Usage Examples

### Fetch skill as JSON
\`\`\`bash
curl ${baseUrl}/api/skills/:owner/:name
\`\`\`

### Fetch skill as Markdown
\`\`\`bash
curl -H "Accept: text/markdown" ${baseUrl}/api/skills/:owner/:name
\`\`\`

### Direct Markdown URL
\`\`\`bash
curl ${baseUrl}/skills/:owner/:name.md
\`\`\`

---

Generated: ${new Date().toISOString()}
`;

    return new NextResponse(content, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Error generating llms.txt:", error);
    return new NextResponse("Error generating llms.txt", { status: 500 });
  }
}
