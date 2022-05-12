module.exports = {
  content: ["./src/**/*.{html,js}"],
  purge: {
    enabled: process.env.TAILWIND_MODE === "build",
    content: ["./src/**/*.{html,scss,ts}"],
  },
  darkMode: "media", // or 'media' or 'class'
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        bg: "#e4e1da",
        "bg-dark": "#111313",
        "page-bg": "#f7f6eb",
        "page-bg-dark": "#0a0a0a",
        dash: "#1e2121",
        "dash-dark": "#3F4141",
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
