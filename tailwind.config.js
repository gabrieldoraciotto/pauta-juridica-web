/** @type {import('tailwindcss').Config} */
export default {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Identidade visual do escritório da Dra. Sara Rocha
        cream: {
          DEFAULT: "#F5F0E8", // fundo
          deep: "#E8DCC8", // fundo alternativo / faixas
          card: "#FBF9F4", // superfície dos cards
        },
        forest: {
          DEFAULT: "#1B4332", // verde-escuro principal
          light: "#1B4F3D",
          soft: "#2E5E4A",
        },
        gold: {
          DEFAULT: "#C9A961", // dourado / rótulos
          deep: "#B07D3A", // mostarda
        },
        ink: "#2A241E", // texto
        muted: "#6B6155", // texto secundário
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(42,36,30,0.04), 0 8px 24px rgba(42,36,30,0.06)",
        lift: "0 4px 12px rgba(42,36,30,0.08), 0 16px 40px rgba(42,36,30,0.10)",
      },
    },
  },
  plugins: [],
};
