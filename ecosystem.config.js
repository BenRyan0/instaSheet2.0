module.exports = {
  apps: [
    {
      name: 'mateker-api',
      script: 'server/dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'mateker-client',
      script: 'serve',
      env: {
        PM2_SERVE_PATH: 'client/dist',
        PM2_SERVE_PORT: 5173,
        PM2_SERVE_SPA: 'true',
      },
    },
  ],
};
