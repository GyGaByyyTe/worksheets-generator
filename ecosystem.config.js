module.exports = {
  apps: [
    {
      name: 'wg-server',
      cwd: __dirname,
      script: 'pnpm',
      args: 'start:server',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
        PORT: '4000',
      },
      watch: false,
      max_restarts: 10,
      restart_delay: 2000,
      autorestart: true,
    },
    {
      name: 'wg-web',
      cwd: __dirname,
      script: 'pnpm',
      args: 'start:web',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
        NEXT_PUBLIC_API_URL: 'https://kids.does.cool/api',
        PORT: '3000',
      },
      watch: false,
      max_restarts: 10,
      restart_delay: 2000,
      autorestart: true,
    },
  ],
};
