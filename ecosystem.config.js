module.exports = {
  apps: [
    {
      name: 'mateker',
      script: 'server/dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
