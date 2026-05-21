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
          green: {
            50:  "#f0f4e8",
            100: "#dde9c8",
            200: "#bdd499",
            300: "#95b96a",
            400: "#72a046",
            500: "#4d7a2a",
            600: "#3a6020",
            700: "#2d5016",  // primary deep green
            800: "#1e3610",
            900: "#111f08",
          },
          gold: {
            50:  "#fdf8ec",
            100: "#faefd0",
            200: "#f4dda0",
            300: "#ecc565",
            400: "#e3ac35",
            500: "#c9a84c",  // primary gold
            600: "#a8872e",
            700: "#876820",
            800: "#614c18",
            900: "#3d3010",
          },
          ivory: "#FEFCF7",
          cream: "#F7F2E8",
          blush: "#D4A5A5",
          charcoal: "#1A1A1A",
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
