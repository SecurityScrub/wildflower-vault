// Seeds the email marketing platform with preset templates on every deploy
// IF the slug doesn't already exist. Edits to a preset (by the operator) are
// preserved — we never overwrite an existing row.

import { PrismaClient } from "@prisma/client";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://thewildflowervault.com";
const SIGNATURE = { kind: "signature", signoff: "With love", name: "The Wild Flower Vault" };

const PRESETS = [
  {
    slug: "inquiry-follow-up",
    name: "Inquiry Follow-up",
    subject: "Hi {{first_name}}, thanks for reaching out!",
    blocks: [
      { kind: "heading", text: "So happy you reached out, {{first_name}}!" },
      { kind: "paragraph", text: "I wanted to send a quick note to say thank you for inquiring about your event. I read through every message personally and I'm so excited to learn more about what you're planning." },
      { kind: "paragraph", text: "The easiest next step is a free 30-minute consultation — phone, video, or in person at our Des Moines studio. No pressure, no obligation. Just a conversation about your vision." },
      { kind: "button", text: "Book My Free Consultation", url: `${SITE}/wedding-planning#inquire` },
      { kind: "paragraph", text: "If you'd rather just reply to this email with a few questions, that works too. Whatever feels right for you." },
      SIGNATURE,
    ],
  },
  {
    slug: "consultation-reminder",
    name: "Consultation Reminder",
    subject: "Looking forward to our chat, {{first_name}}",
    blocks: [
      { kind: "heading", text: "Excited to talk soon!" },
      { kind: "paragraph", text: "Just a friendly reminder that we have a consultation coming up. I've blocked out time on my calendar and I'm looking forward to hearing about your day." },
      { kind: "paragraph", text: "A few things that help me prep:" },
      { kind: "paragraph", text: "• Your wedding date (or rough range)\n• How many guests you're imagining\n• Any inspiration / Pinterest links you want to share\n• Questions you want to make sure we cover" },
      { kind: "paragraph", text: "No need to send these ahead — we can chat through them together. Just helps to have them top of mind." },
      SIGNATURE,
    ],
  },
  {
    slug: "lead-re-engagement",
    name: "Lead Re-engagement",
    subject: "Still thinking about your wedding, {{first_name}}?",
    blocks: [
      { kind: "heading", text: "Hi {{first_name}} — checking in" },
      { kind: "paragraph", text: "It's been a little while since we connected and I wanted to circle back. Wedding planning is a lot, and timelines shift — totally normal." },
      { kind: "paragraph", text: "If you're still in the early stages, I'd love to be a sounding board. If you've moved forward with another planner, no hard feelings at all — I'd just love to hear how it's going." },
      { kind: "button", text: "Pick Up Where We Left Off", url: `${SITE}/wedding-planning#inquire` },
      { kind: "divider" },
      { kind: "paragraph", text: "And if your timeline changed, just let me know — we serve couples planning anywhere from 18 months to 3 weeks out." },
      SIGNATURE,
    ],
  },
  {
    slug: "seasonal-newsletter",
    name: "Seasonal Newsletter",
    subject: "What's blooming this season at The Wild Flower Vault",
    blocks: [
      { kind: "heading", text: "Behind the scenes at The Wild Flower Vault" },
      { kind: "paragraph", text: "A quick note from the studio — some news, a peek at what we're loving this season, and a couple of things I'm excited about." },
      { kind: "divider" },
      { kind: "heading", text: "What's new" },
      { kind: "paragraph", text: "Add a couple of sentences about a recent wedding, a new rental piece, or a seasonal trend you're seeing. Keep it personal." },
      { kind: "heading", text: "This season's favorites" },
      { kind: "paragraph", text: "Highlight a featured rental or planning package. Add a photo below for visual punch." },
      { kind: "button", text: "Browse the Collection", url: `${SITE}/rentals` },
      { kind: "divider" },
      { kind: "paragraph", text: "As always, if you're thinking about your own day — even if it's a year out — let's chat. The earlier we start, the better the design gets." },
      { kind: "button", text: "Book a Free Consultation", url: `${SITE}/wedding-planning#inquire` },
      SIGNATURE,
    ],
  },
];

async function main() {
  const prisma = new PrismaClient();
  try {
    for (const tpl of PRESETS) {
      const existing = await prisma.emailTemplate.findUnique({ where: { slug: tpl.slug } });
      if (existing) continue;
      await prisma.emailTemplate.create({
        data: {
          slug: tpl.slug,
          name: tpl.name,
          subject: tpl.subject,
          blocks: tpl.blocks,
          isPreset: true,
        },
      });
      console.log(`[bootstrap-email-presets] Seeded preset "${tpl.slug}".`);
    }
  } catch (err) {
    console.error("[bootstrap-email-presets] Failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
