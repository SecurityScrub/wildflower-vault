import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://thewildflowervault.com"),
  title: {
    default: "The Wild Flower Vault | Wedding & Event Rentals – Des Moines, Iowa",
    template: "%s | The Wild Flower Vault",
  },
  description:
    "Elegant photo walls, flower walls, and photo booth rentals for weddings and events in Des Moines, Iowa. Book your dream backdrop today.",
  keywords: [
    "photo wall rental Des Moines",
    "flower wall rental Iowa",
    "photo booth rental Des Moines",
    "wedding rental Iowa",
    "event backdrop rental",
    "wild flower vault",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://thewildflowervault.com",
    siteName: "The Wild Flower Vault",
    images: [{ url: "/images/og-image.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@wildflowervault",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "@id": "https://thewildflowervault.com",
              name: "The Wild Flower Vault",
              description:
                "Wedding and event rental company offering photo walls, flower walls, and photo booths in Des Moines, Iowa.",
              url: "https://thewildflowervault.com",
              telephone: "",
              address: {
                "@type": "PostalAddress",
                addressLocality: "Des Moines",
                addressRegion: "IA",
                addressCountry: "US",
              },
              geo: {
                "@type": "GeoCoordinates",
                latitude: 41.5868,
                longitude: -93.625,
              },
              areaServed: {
                "@type": "State",
                name: "Iowa",
              },
              priceRange: "$$",
              hasOfferCatalog: {
                "@type": "OfferCatalog",
                name: "Wedding & Event Rentals",
                itemListElement: [
                  { "@type": "Offer", itemOffered: { "@type": "Product", name: "Flower Wall Rental" } },
                  { "@type": "Offer", itemOffered: { "@type": "Product", name: "Photo Booth Rental" } },
                ],
              },
            }),
          }}
        />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
