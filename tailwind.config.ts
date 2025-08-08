import { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ...existing colors...
        'calendar-green': {
          DEFAULT: 'var(--color-calendar-green)',
          hover: 'var(--color-calendar-green-hover)',
        },
        'calendar-grey': {
          DEFAULT: 'var(--color-calendar-grey)',
          hover: 'var(--color-calendar-grey-hover)',
        },
      },
      // ...existing code...
    },
  },
  plugins: [],
} satisfies Config;