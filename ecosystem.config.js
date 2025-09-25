image.pngmodule.exports = {
  apps: [
    {
      name: "auto-login-control-system",
      script: "main.js",
      env: {
        NODE_ENV: "production",
        PORT: 4000,
        WS_PORT: 8083,
      },
      instances: 1,
      exec_mode: "fork",
      watch: false,
      max_memory_restart: "1G",
      error_file: "./logs/control-system-error.log",
      out_file: "./logs/control-system-out.log",
      log_file: "./logs/control-system-combined.log",
      time: true,
    },
    {
      name: "system-monitor",
      script: "system-monitor.js",
      env: {
        NODE_ENV: "production",
      },
      instances: 1,
      exec_mode: "fork",
      watch: false,
      error_file: "./logs/monitor-error.log",
      out_file: "./logs/monitor-out.log",
      time: true,
    },
  ],
};
