import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = process.env.ADMIN_PASSWORD ?? "ChangeMe123!";
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@thewildflowervault.com";

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    await prisma.user.create({
      data: {
        name: "Admin",
        email: adminEmail,
        passwordHash: await bcrypt.hash(adminPassword, 12),
        role: "ADMIN",
      },
    });
    console.log(`✓ Admin user created: ${adminEmail}`);
  }

  // Seed rental items
  const rentals = [
    {
      slug: "garden-rose-flower-wall",
      name: "Garden Rose Flower Wall",
      tagline: "Lush, romantic, timeless",
      description: "A full wall of hand-arranged garden roses in blush, cream, and dusty rose. Perfect for wedding ceremonies and reception photo walls.",
      longDesc: "Our Garden Rose Flower Wall is crafted from premium silk roses in a curated palette of blush pink, antique cream, and dusty rose. The wall measures 8×8 ft and includes free-standing frame hardware for easy setup anywhere. Delivery, setup, and teardown are included in all rentals.",
      price: 350,
      depositPct: 50,
      category: "flower-walls",
      features: [
        "8×8 ft wall coverage",
        "Premium silk roses – blush, cream & dusty rose",
        "Free-standing frame included",
        "Delivery & setup included",
        "Available throughout Iowa",
      ],
      dimensions: "8 ft × 8 ft",
      images: [],
      isFeatured: true,
      sortOrder: 1,
    },
    {
      slug: "greenery-eucalyptus-wall",
      name: "Greenery & Eucalyptus Wall",
      tagline: "Garden-fresh, bohemian",
      description: "Cascading greenery with eucalyptus branches for a lush, garden-inspired backdrop that photographs beautifully in any lighting.",
      longDesc: "Crafted with layered silk eucalyptus and tropical greenery, this wall creates an organic, garden-fresh atmosphere. The 8×8 ft wall works beautifully for outdoor venues and barn weddings.",
      price: 325,
      depositPct: 50,
      category: "flower-walls",
      features: [
        "8×8 ft wall coverage",
        "Mixed eucalyptus & greenery",
        "Free-standing frame included",
        "Delivery & setup included",
        "Works indoors and outdoors",
      ],
      dimensions: "8 ft × 8 ft",
      images: [],
      isFeatured: true,
      sortOrder: 2,
    },
    {
      slug: "wildflower-meadow-wall",
      name: "Wildflower Meadow Wall",
      tagline: "Iowa summer in bloom",
      description: "A burst of wildflowers evoking an Iowa summer meadow — sunflowers, lavender, poppies, and daisies in a vibrant, joyful arrangement.",
      price: 375,
      depositPct: 50,
      category: "flower-walls",
      features: [
        "8×8 ft wall coverage",
        "Mixed wildflower arrangement",
        "Vibrant seasonal palette",
        "Delivery & setup included",
      ],
      dimensions: "8 ft × 8 ft",
      images: [],
      isFeatured: true,
      sortOrder: 3,
    },
    {
      slug: "360-photo-booth",
      name: "360° Video Photo Booth",
      tagline: "The event showstopper",
      description: "Slow-motion 360° video booth that creates shareable, cinematic clips your guests will post everywhere. Includes custom overlay and attendant.",
      longDesc: "Our 360° photo booth spins around your guests to capture a stunning slow-motion video clip. Includes a dedicated attendant for the entire event, custom overlay branding, instant social media sharing, and unlimited sessions.",
      price: 495,
      depositPct: 50,
      category: "photo-booths",
      features: [
        "Unlimited sessions",
        "Dedicated on-site attendant",
        "Custom overlay / branding",
        "Instant social media sharing",
        "4-hour rental window",
        "Delivery & setup included",
      ],
      images: [],
      isFeatured: true,
      sortOrder: 4,
    },
    {
      slug: "glam-mirror-photo-booth",
      name: "Glam Mirror Photo Booth",
      tagline: "Touch-screen magic",
      description: "A full-length touch-screen mirror booth with animated prompts, custom overlays, emoji and signature features, and instant printing.",
      price: 450,
      depositPct: 50,
      category: "photo-booths",
      features: [
        "Full-length mirror display",
        "Touch-screen interaction",
        "Instant 2×6 or 4×6 prints",
        "Custom overlay / branding",
        "Unlimited sessions",
        "Dedicated attendant",
        "4-hour rental window",
      ],
      images: [],
      isFeatured: true,
      sortOrder: 5,
    },
    {
      slug: "pampas-grass-arch",
      name: "Pampas Grass Arch",
      tagline: "Bohemian minimalism",
      description: "Dried pampas grass arch for a timeless, modern ceremony backdrop. Pairs beautifully with minimalist and boho wedding aesthetics.",
      price: 275,
      depositPct: 50,
      category: "arches",
      features: [
        "6 ft × 6 ft arch",
        "Dried pampas grass",
        "Free-standing frame",
        "Delivery & setup included",
      ],
      dimensions: "6 ft × 6 ft",
      images: [],
      isFeatured: true,
      sortOrder: 6,
    },
  ];

  for (const rental of rentals) {
    await prisma.rentalItem.upsert({
      where: { slug: rental.slug },
      update: {},
      create: rental,
    });
    console.log(`✓ Rental: ${rental.name}`);
  }

  // Seed default settings
  const defaults = [
    { key: "business_name", value: "The Wild Flower Vault", group: "business", label: "Business Name" },
    { key: "business_address", value: "Des Moines, Iowa", group: "business", label: "Address" },
    { key: "smtp_host", value: "smtp.zeptomail.com", group: "email", label: "SMTP Host" },
    { key: "smtp_port", value: "587", group: "email", label: "SMTP Port" },
    { key: "from_name", value: "The Wild Flower Vault", group: "email", label: "From Name" },
    { key: "google_calendar_enabled", value: "false", group: "calendar", label: "Enable Sync" },
    { key: "square_environment", value: "sandbox", group: "square", label: "Environment" },
  ];

  for (const setting of defaults) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  console.log("✓ Default settings applied");
  console.log("\n🌸 Seed complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
