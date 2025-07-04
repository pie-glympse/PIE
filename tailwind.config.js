// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        urbanist: ["var(--font-urbanist)", "Urbanist", "sans-serif"],
        poppins: ["var(--font-poppins)", "Poppins", "sans-serif"],
      },
      fontSize: {
        h1: ["33px", { lineHeight: "1.2", fontWeight: "600" }], // Urbanist SemiBold
        h2: ["24px", { lineHeight: "1.3", fontWeight: "500" }], // Poppins Medium
        h3: ["22px", { lineHeight: "1.3", fontWeight: "500" }],
        bodyLarge: ["19px", { lineHeight: "1.5", fontWeight: "500" }],
        bodySmall: ["16px", { lineHeight: "1.5", fontWeight: "500" }],
      },
      colors: {
        main: "#FCC638",
        secondary: "#FF5B5B",
        tertiary: "#F78AFF",
        validate: "#2B983F",
        greyOne: "#F4F4F4",
        greyTwo: "#EAEAEF",
        greyThree: "#9B9B9B",
        greyFour: "#9B9B9D",
        text: "#191919",
      },
    },
  },
  plugins: [],
}
