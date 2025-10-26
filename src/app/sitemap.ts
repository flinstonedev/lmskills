import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://lmskills.com'

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/skills`,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/docs`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
  ]

  // Note: For dynamic skill pages, you would need to fetch from your database
  // This is a placeholder structure showing how it would be implemented
  // In production, you'd fetch actual skills from Convex and add them here
  // Example:
  // const skills = await fetchAllSkills()
  // const skillPages = skills.map(skill => ({
  //   url: `${baseUrl}/skills/${skill.owner}/${skill.name}`,
  //   lastModified: skill.updatedAt || skill.createdAt,
  //   changeFrequency: 'weekly' as const,
  //   priority: 0.7,
  // }))

  return [
    ...staticPages,
    // ...skillPages, // Add when implementing dynamic fetching
  ]
}
