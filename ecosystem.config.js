module.exports = {
  apps: [{
      port        : 8000,
      name        : "server",
      script      : "./api/index.js",
      env: {
          NODE_ENV: "production",
      }
  }]
}