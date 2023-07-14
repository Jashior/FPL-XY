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
      height: {
        "700px": "700px",
        "450px": "450px",
        "420px": "420px",
        "90vh": "90vh",
        "80vh": "80vh",
      },
      width: {
        "900px": "900px",
        "600px": "600px",
        "400px": "400px",
        "90vw": "90vw",
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
