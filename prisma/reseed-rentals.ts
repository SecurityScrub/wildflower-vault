import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const rentals = [
  {
    slug: "5d-wildflower-wall-blue-pink-white",
    name: "5D WildFlower Wall – Blue, Pink & White",
    tagline: "A vibrant burst of blue, pink, and white wildflowers",
    description:
      "Transform your event space with our stunning 8' x 8' WildFlower 5D Wall, featuring lifelike blue, pink, and white wildflowers that create an immersive, three-dimensional floral experience. The vivid color palette brings energy and elegance to any setting — perfect as a ceremony backdrop, photo wall, or statement piece at your reception.",
    longDesc:
      "This showstopping 5D floral wall features meticulously crafted silk wildflowers in shades of cornflower blue, soft blush pink, and crisp white, arranged to create real depth and dimension. Unlike flat printed backdrops, our 5D walls use layered floral elements that catch the light beautifully in photos and create a truly immersive experience for your guests.\n\nIdeal for weddings, bridal showers, engagement parties, corporate events, and milestone celebrations. The wall arrives fully assembled — our team handles delivery, professional setup, and teardown so you can focus entirely on your event.\n\nA mileage fee applies for venues located more than 20 miles from Des Moines, Iowa.",
    price: 400,
    category: "flower-walls",
    dimensions: "8' x 8'",
    features: [
      "Lifelike 5D floral design with real depth and dimension",
      "Vibrant blue, pink, and white color palette",
      "Professional delivery, setup, and teardown included",
      "Perfect for weddings, parties, and corporate events",
      "Stunning photo backdrop for guests",
    ],
    isFeatured: true,
    sortOrder: 1,
  },
  {
    slug: "5d-wildflower-wall-beige-pink-white",
    name: "5D WildFlower Wall – Beige, Pink & White",
    tagline: "Soft and romantic in beige, pink, and white tones",
    description:
      "Elevate your event with our elegant 8' x 8' WildFlower 5D Wall in a beautiful palette of beige, pink, and white. This captivating wall brings a soft, romantic feel to any space — ideal for weddings seeking a warm, neutral-toned floral backdrop that photographs beautifully in any lighting.",
    longDesc:
      "Our beige, pink, and white 5D floral wall offers a softer, more romantic alternative for couples and hosts who prefer warm, muted tones. The layered silk flowers create genuine three-dimensional depth, with roses, peonies, and wildflower accents in blush, champagne, and ivory tones.\n\nThis wall is one of our most popular choices for wedding ceremonies and sweetheart table backdrops, as the neutral palette complements virtually any color scheme and venue decor. It also photographs beautifully under both natural and artificial lighting.\n\nDelivery, professional setup, and teardown are all included. A mileage fee applies for venues located more than 20 miles from Des Moines, Iowa.",
    price: 400,
    category: "flower-walls",
    dimensions: "8' x 8'",
    features: [
      "Lifelike 5D floral design with real depth and dimension",
      "Warm beige, pink, and white color palette",
      "Professional delivery, setup, and teardown included",
      "Complements virtually any color scheme",
      "Ideal for ceremonies and sweetheart table backdrops",
    ],
    isFeatured: true,
    sortOrder: 2,
  },
  {
    slug: "5d-wildflower-wall-beige-white",
    name: "5D WildFlower Wall – Beige & White",
    tagline: "Timeless elegance in beige and white",
    description:
      "Our most refined floral wall — an 8' x 8' 5D design in sophisticated beige and white. This elegant wall adds a touch of understated luxury to weddings, showers, and upscale events, creating a clean and classic backdrop that lets your event styling shine.",
    longDesc:
      "For those who prefer a clean, classic aesthetic, our beige and white 5D floral wall delivers timeless sophistication. The carefully curated arrangement features ivory roses, cream peonies, and neutral wildflower accents that create a luxurious, gallery-quality backdrop.\n\nThis is our most versatile wall — it pairs beautifully with rustic barn venues, modern lofts, and traditional ballrooms alike. The neutral palette ensures your florals, signage, and decor remain the focal point while the wall elevates the entire scene.\n\nDelivery, professional setup, and teardown are all included. A mileage fee applies for venues located more than 20 miles from Des Moines, Iowa.",
    price: 400,
    category: "flower-walls",
    dimensions: "8' x 8'",
    features: [
      "Lifelike 5D floral design with real depth and dimension",
      "Sophisticated beige and white color palette",
      "Professional delivery, setup, and teardown included",
      "Versatile — complements any venue style",
      "Clean, classic look that photographs beautifully",
    ],
    isFeatured: true,
    sortOrder: 3,
  },
  {
    slug: "shimmer-wall-pink",
    name: "Shimmer Wall – Pink",
    tagline: "Dazzling pink shimmer that catches every light",
    description:
      "Add instant glamour to your event with our 8' x 8' Shimmer Pink Wall. This eye-catching backdrop features thousands of shimmering sequin panels that sparkle and dance with movement and light — perfect for birthdays, bachelorette parties, sweet sixteens, and any celebration that calls for a bold statement.",
    longDesc:
      "Our Shimmer Pink Wall is pure party energy. Thousands of individually mounted sequin panels catch and reflect light from every angle, creating a mesmerizing, ever-shifting shimmer effect that looks incredible in photos and videos. The vibrant pink hue adds warmth, fun, and a touch of glamour to any event space.\n\nThis wall is a guest favorite — people can't resist taking photos in front of the cascading shimmer effect. It's especially popular for birthday celebrations, bachelorette parties, baby showers, and brand activations where you want a bold, Instagram-worthy backdrop.\n\nDelivery, professional setup, and teardown are all included. A mileage fee applies for venues located more than 20 miles from Des Moines, Iowa.",
    price: 400,
    category: "backdrops",
    dimensions: "8' x 8'",
    features: [
      "Thousands of shimmering sequin panels",
      "Dynamic light-catching effect",
      "Professional delivery, setup, and teardown included",
      "Instagram-worthy photo backdrop",
      "Perfect for birthdays, bachelorettes, and brand events",
    ],
    isFeatured: true,
    sortOrder: 4,
  },
  {
    slug: "5d-white-floral-arch",
    name: "5D White Floral Arch",
    tagline: "Romantic white floral pillars for ceremonies and entrances",
    description:
      "An elegant pair of lush white floral pillars featuring roses, ranunculus, and soft greenery — perfect for framing your ceremony, entrance, or head table. This timeless, romantic piece is designed to elevate any event space with classic beauty.",
    longDesc:
      "Our 5D White Floral Arch consists of two stunning floral pillars adorned with lifelike white roses, ranunculus, and delicate greenery accents. The pillars can be positioned to frame a ceremony altar, mark an entrance, flank a sweetheart table, or serve as a standalone photo backdrop.\n\nThe all-white palette with touches of soft green creates a timeless, romantic look that suits garden weddings, church ceremonies, ballroom receptions, and intimate celebrations alike. The 5D construction gives the arrangement genuine depth and fullness that flat or printed backdrops simply can't match.\n\nDelivery, professional setup, and teardown are all included. A mileage fee applies for venues located more than 20 miles from Des Moines, Iowa.",
    price: 200,
    category: "arches",
    features: [
      "Pair of lush white floral pillars",
      "Lifelike roses, ranunculus, and greenery",
      "Versatile placement — ceremony, entrance, or head table",
      "Professional delivery, setup, and teardown included",
      "Timeless romantic aesthetic",
    ],
    isFeatured: false,
    sortOrder: 5,
  },
  {
    slug: "wicker-throne-chair",
    name: "Wicker Throne Chair",
    tagline: "A regal statement piece for your event",
    description:
      "Make a statement with our elegant Wicker Throne Chair. Beautifully crafted with intricate wicker detailing, this oversized chair adds sophistication and charm — perfect as a focal point for weddings, baby showers, bridal showers, and photoshoots.",
    longDesc:
      "Our Wicker Throne Chair is a stunning statement piece that instantly elevates any event. The oversized design features intricate wicker construction with a high, fan-shaped back that creates a regal silhouette — perfect for the guest of honor at a baby shower, the bride at her bridal shower, or as a photo prop at a wedding reception.\n\nThe natural wicker finish pairs beautifully with floral arrangements, draped fabrics, and balloon installations. Many of our clients love pairing the throne with one of our floral walls for a truly memorable photo setup.\n\nDelivery and pickup are included. Setup assistance available upon request.",
    price: 50,
    category: "decor",
    features: [
      "Oversized wicker design with fan-shaped back",
      "Intricate handcrafted detailing",
      "Spacious, comfortable seating",
      "Pairs beautifully with floral walls and backdrops",
      "Delivery and pickup included",
    ],
    isFeatured: false,
    sortOrder: 6,
  },
  {
    slug: "digital-photo-booth",
    name: "Digital Photo Booth",
    tagline: "High-quality photos, GIFs, and boomerangs for your guests",
    description:
      "A sleek, modern digital photo booth that captures high-quality photos, GIFs, and boomerangs — perfect for weddings, parties, and corporate events. Guests can instantly share their favorites via text or email, making every moment shareable.",
    longDesc:
      "Our Digital Photo Booth brings the fun with a sleek, modern setup that's incredibly easy for guests to use. The booth captures high-resolution photos, animated GIFs, and boomerang-style videos that guests can instantly share via text message or email — no app download required.\n\nThe user-friendly touchscreen interface guides guests through the experience, and each photo can be customized with your event branding, date, and hashtag overlay. It's a guaranteed crowd-pleaser that keeps guests entertained and gives everyone a digital keepsake to remember the night.\n\nOptional on-site attendant available as an add-on for an additional charge. Delivery, setup, and teardown are included with every booking. A mileage fee applies for venues located more than 20 miles from Des Moines, Iowa.",
    price: 200,
    category: "photo-booths",
    features: [
      "High-resolution photos, GIFs, and boomerangs",
      "Instant sharing via text or email",
      "Custom event branding and overlays",
      "Modern, user-friendly touchscreen interface",
      "Delivery, setup, and teardown included",
      "Optional on-site attendant available",
    ],
    isFeatured: false,
    sortOrder: 7,
  },
];

async function main() {
  // Delete all existing rental items
  const deleted = await prisma.rentalItem.deleteMany({});
  console.log(`✓ Deleted ${deleted.count} existing rentals`);

  // Create new rentals
  for (const rental of rentals) {
    const item = await prisma.rentalItem.create({
      data: {
        ...rental,
        depositPct: 50,
        priceType: "PER_EVENT",
        images: [],
        isActive: true,
      },
    });
    console.log(`✓ Created: ${item.name} — $${item.price}`);
  }

  console.log(`\n🌸 Done! ${rentals.length} rental items created.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
