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
      script: 'npx',
      args: 'serve -s client/dist -l 5173',
      interpreter: 'none',
      autorestart: true,
      watch: false,
    },
  ],
};
