// PM2 ecosystem configuration
const path = require('path');

module.exports = {
  apps: [
    {
      name: 'websocket',
      script: path.join(__dirname, 'ws-server.js'),
      cwd: path.join(__dirname, '..'),
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      error_file: '/tmp/ws-server-error.log',
      out_file: '/tmp/ws-server.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      env: {
        NODE_ENV: 'development',
      },
    },
    {
      name: 'astro',
      script: 'npm',
      args: 'run dev',
      cwd: path.join(__dirname, '..'),
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      error_file: '/tmp/astro-error.log',
      out_file: '/tmp/astro.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      env: {
        NODE_ENV: 'development',
      },
    },
  ],
};
