const { spawn } = require('child_process');
const path = require('path');

console.log('⚡ Starting QueueFlow Development Environment...\n');

// 1. Start Server
const server = spawn('node', ['server/src/server.js'], {
  stdio: 'inherit',
  shell: true
});

// 2. Start Client
const client = spawn('npm', ['--prefix', 'client', 'run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

process.on('SIGINT', () => {
  server.kill('SIGINT');
  client.kill('SIGINT');
  process.exit();
});

process.on('SIGTERM', () => {
  server.kill('SIGTERM');
  client.kill('SIGTERM');
  process.exit();
});
