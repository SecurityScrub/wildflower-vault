import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thewildflowervault.com";

  const rentals = await prisma.rentalItem.findMany({
    where: { isActive: true },
    select: { slug: true, updatedAt: true },
  });

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/rentals`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/book`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/inquiry`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  ];

  const rentalPages: MetadataRoute.Sitemap = rentals.map((r) => ({
    url: `${baseUrl}/rentals/${r.slug}`,
    lastModified: r.updatedAt,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticPages, ...rentalPages];
}
