/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#030303",
        panel: "#0a0a0a",
        panel2: "#171717",
        line: "#2a2a2a",
        signal: "#ffffff",
        limewash: "#e5e5e5",
        coral: "#a3a3a3",
        violet: "#737373"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255, 255, 255, 0.14), 0 30px 90px rgba(0, 0, 0, 0.55)",
        panel: "0 18px 60px rgba(0, 0, 0, 0.34)"
      }
    }
  },
  plugins: []
};
