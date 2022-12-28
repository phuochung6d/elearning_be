module.exports = {
    apps: [{
        port        : 8000,
        name        : "server",
        script      : "./api/index.cjs",
        env: {
            NODE_ENV: "production",
        }
    }]
}