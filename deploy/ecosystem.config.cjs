// deploy/ecosystem.config.cjs
// PM2 Process Manager Configuration for GCP e2-micro (1 GB RAM Optimized)

module.exports = {
  apps: [
    {
      name: 'quinceca',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/quinceca',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '750M', // Prevents Linux OOM-killer on 1GB RAM e2-micro
      node_args: '--max-old-space-size=768',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/var/log/quinceca-error.log',
      out_file: '/var/log/quinceca-out.log',
      merge_logs: true,
      time: true,
    },
  ],
};
