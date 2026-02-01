/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./app/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        /* 🌍 App Base Tokens */
        background: "#0b0f1a",
        surface: "#111827",
        card: "#1f2937",

        /* 🇭🇹 Lakay Social Brand Colors */
        primary: "#2563eb",      // Deep Blue
        secondary: "#ef4444",    // Haitian Red
        accent: "#38bdf8",       // Sky Glow
        highlight: "#facc15",    // Gold Shine

        /* 💬 Chat UI Colors */
        chatBg: "#0f172a",
        chatBubble: "#1e40af",
        chatText: "#f8fafc",

        /* ✅ Status Tokens */
        success: "#22c55e",
        warning: "#f97316",
        danger: "#dc2626",
        info: "#06b6d4",

        /* 🌈 Animated Gradient Colors */
        neonPink: "#ec4899",
        neonPurple: "#a855f7",
        neonBlue: "#3b82f6",
        neonGreen: "#4ade80",
      },

      /* ✨ Custom Gradient Backgrounds */
      backgroundImage: {
        "animated-gradient":
          "linear-gradient(270deg, #2563eb, #ec4899, #a855f7, #38bdf8)",
      },

      /* 🎞 Smooth Animation */
      animation: {
        "gradient-move": "gradientMove 6s ease infinite",
        "pulse-soft": "pulseSoft 2.5s ease-in-out infinite",
      },

      keyframes: {
        gradientMove: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },

        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.65" },
        },
      },

      /* 🌟 Rounded Tokens */
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
    },
  },

  plugins: [],
};
