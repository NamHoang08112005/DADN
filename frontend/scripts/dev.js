'use strict';

const { spawn } = require('node:child_process');
const path = require('node:path');

const nextBin = path.join(__dirname, '..', 'node_modules', 'next', 'dist', 'bin', 'next');
const storageFile = path.join(__dirname, '..', '.node-localstorage');

const nodeOptions = process.env.NODE_OPTIONS || '';
const filteredNodeOptions = nodeOptions
  .split(/\s+/)
  .filter((option) => option && !option.startsWith('--localstorage-file'))
  .join(' ');

const forwardedEnv = {
  ...process.env,
  NODE_OPTIONS: `${filteredNodeOptions} --localstorage-file=${storageFile}`.trim(),
};

const child = spawn(process.execPath, [nextBin, 'dev'], {
  stdio: 'inherit',
  env: forwardedEnv,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
