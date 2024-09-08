module.exports = {
  apps: [
    {
      name: "fplv",
      script: "./server.js",
      watch: false,
      force: true,
      env: {
        PORT: 8080,
        NODE_ENV: "production",
        MY_ENV_VAR: "MyVarValue",
      },
    },
  ],
};
