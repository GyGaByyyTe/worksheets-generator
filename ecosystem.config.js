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
        // Set your production DB URL and JWT secret here or via PM2 ecosystem env
        DATABASE_URL:
          'postgresql://wg_user:wg_password@127.0.0.1:5432/wg?schema=public',
        JWT_SECRET: 'change-me-in-production',
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
