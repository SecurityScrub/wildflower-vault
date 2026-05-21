import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: {
            50:  "#FFF5EF",
            100: "#FFE5D4",
            200: "#FFC7A3",
            300: "#FFA672",
            400: "#FF8541",
            500: "#E06A38",
            600: "#C45528",
            700: "#A8441E",
            800: "#7D3316",
            900: "#58230E",
          },
          pink: {
            50:  "#FEF5F3",
            100: "#FCE8E4",
            200: "#F9D5CE",
            300: "#F2BEB5",
            400: "#E8A59B",
            500: "#D98E84",
            600: "#C4756C",
            700: "#A95E56",
            800: "#864A44",
            900: "#643835",
          },
          ivory: "#FDF7F5",
          cream: "#F9EFEC",
          blush: "#F2BEB5",
          charcoal: "#2D1F1D",
        },
      },
      fontFamily: {
        serif: ["Cormorant Garamond", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out",
        "slide-up": "slideUp 0.6s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
