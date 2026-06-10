import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        suse: ["var(--font-suse)", "sans-serif"],
        "open-sans": ["var(--font-open-sans)", "sans-serif"],
      },
      colors: {
        // ─── Training Excellence Design System ────────────────────────────────
        // Sourced directly from Figma: VoTEBKr8x4fWlObjkr7RXg (nodes 83-3864, 83-4218, 83-3987)

        /** Primary palette — cyan/teal brand colour. primary-500 (#00bbf0) is the main CTA. */
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50: "#e6f8fe",
          100: "#b0eafa",
          200: "#8ae0f8",
          300: "#54d1f5",
          400: "#33c9f3",
          500: "#00bbf0",
          600: "#00aada",
          700: "#0085aa",
          800: "#006784",
          900: "#004f65",
        },

        /** Secondary palette — warm gold/amber brand colour. secondary-500 (#9e6f21) is the accent CTA. */
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          50: "#f5f1e9",
          100: "#e1d2ba",
          200: "#d2bd99",
          300: "#be9f6a",
          400: "#b18c4d",
          500: "#9e6f21",
          600: "#90651e",
          700: "#704f17",
          800: "#573d12",
          900: "#422f0e",
        },

        /** Neutral palette — slate/navy greyscale. */
        neutral: {
          0: "#ffffff",
          10: "#fafbfb",
          20: "#f5f6f8",
          30: "#ebedf1",
          40: "#dee2e7",
          50: "#bfc7d2",
          60: "#b0bac7",
          70: "#a3afbe",
          80: "#94a1b3",
          90: "#8594a8",
          100: "#75879d",
          200: "#667992",
          300: "#576c88",
          400: "#4a617e",
          500: "#3b5374",
          600: "#2e486b",
          700: "#1c395e",
          800: "#0d2b53",
          900: "#00204a",
        },

        // ─── shadcn/ui semantic tokens (backed by CSS variables) ─────────────
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },

        /** Dynamic student dashboard theme from WP admin color-settings */
        "lms-primary": "var(--color-primary, #0f217d)",
        "lms-secondary": "var(--color-secondary, #16c2d5)",
        "lms-background": "var(--color-background, #ffffff)",
        "lms-text": "var(--color-text, #2E323E)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "infinite-scroll": {
          from: { transform: "translateX(0)" },
          to: { transform: 'translateX(-50%)' },
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "infinite-scroll": "infinite-scroll 25s linear infinite",
      },
    },
  },
  plugins: [animate],
};

export default config;
