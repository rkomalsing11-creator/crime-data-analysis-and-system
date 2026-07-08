#!/usr/bin/env node
'use strict';

/**
 * Crime Reporting & Analysis System - cross-platform startup script.
 *
 * Usage:
 *   node start.js
 *   node start.js --no-browser
 *
 * Does the same job as start.sh (installs missing deps, creates
 * server/.env and uploads/ if missing, waits for every server to
 * actually respond before opening the browser, cleans up all processes
 * on Ctrl+C) but works on Windows too - no bash, Git Bash or WSL
 * required.
 *
 * The analysis/ (Python/Flask) service is optional - if that folder
 * doesn't exist yet, this script just skips it and runs client+server
 * as before.
 */

const { spawn, spawnSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const PROJECT_DIR = __dirname;
const CLIENT_DIR = path.join(PROJECT_DIR, 'client');
const SERVER_DIR = path.join(PROJECT_DIR, 'server');
const ANALYSIS_DIR = path.join(PROJECT_DIR, 'analysis');
const BACKEND_PORT = 5001;
const FRONTEND_PORT = 3000;
const ANALYSIS_PORT = 5002;
const NO_BROWSER = process.argv.includes('--no-browser');

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

const color = (code, s) => `\x1b[${code}m${s}\x1b[0m`;
const info = (s) => console.log(color('36', '[INFO]') + ' ' + s);
const success = (s) => console.log(color('32', '[SUCCESS]') + ' ' + s);
const error = (s) => console.log(color('31', '[ERROR]') + ' ' + s);
const warning = (s) => console.log(color('33', '[WARNING]') + ' ' + s);

const children = [];
let shuttingDown = false;

function killAll() {
  if (shuttingDown) return;
  shuttingDown = true;
  info('Shutting down...');
  for (const child of children) {
    if (child && !child.killed) {
      try { child.kill(); } catch (_) { /* already gone */ }
    }
  }
}

process.on('exit', killAll);
process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.get({ host: 'localhost', port, timeout: 1000, path: '/' }, (res) => {
      res.resume();
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

async function waitForPort(port, label, maxAttempts = 30) {
  for (let i = 1; i <= maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 500));
    if (await checkPort(port)) {
      success(`${label} is ready on http://localhost:${port}`);
      return true;
    }
    if (i % 10 === 0) info(`Still waiting for ${label}... (${i}/${maxAttempts})`);
  }
  return false;
}

function installIfNeeded(dir, label) {
  const nodeModules = path.join(dir, 'node_modules');
  if (!fs.existsSync(nodeModules)) {
    warning(`${label} dependencies not installed.`);
    info(`Running npm install in ${path.relative(PROJECT_DIR, dir)}/`);
    const result = spawnSync(npmCmd, ['install'], { cwd: dir, stdio: 'inherit', shell: isWin });
    if (result.error || result.status !== 0) {
      error(`npm install failed in ${dir}`);
      process.exit(1);
    }
    success(`${label} dependencies installed.`);
  } else {
    info(`${label} dependencies already installed.`);
  }
}

function findPython() {
  for (const bin of ['python3', 'python']) {
    const check = spawnSync(bin, ['--version'], { shell: isWin });
    if (!check.error && check.status === 0) return bin;
  }
  return null;
}

function venvPaths(dir) {
  return isWin
    ? { python: path.join(dir, 'venv', 'Scripts', 'python.exe'), pip: path.join(dir, 'venv', 'Scripts', 'pip.exe') }
    : { python: path.join(dir, 'venv', 'bin', 'python'), pip: path.join(dir, 'venv', 'bin', 'pip') };
}

function setupAnalysisEnv(pythonBin) {
  const venvDir = path.join(ANALYSIS_DIR, 'venv');
  if (!fs.existsSync(venvDir)) {
    warning('Analysis service dependencies not installed.');
    info('Creating virtual environment and installing requirements...');
    let result = spawnSync(pythonBin, ['-m', 'venv', 'venv'], { cwd: ANALYSIS_DIR, stdio: 'inherit', shell: isWin });
    if (result.error || result.status !== 0) {
      error('Failed to create the Python virtual environment.');
      process.exit(1);
    }
    const { pip } = venvPaths(ANALYSIS_DIR);
    result = spawnSync(pip, ['install', '--quiet', '-r', 'requirements.txt'], { cwd: ANALYSIS_DIR, stdio: 'inherit', shell: isWin });
    if (result.error || result.status !== 0) {
      error('pip install failed for the analysis service.');
      process.exit(1);
    }
    success('Analysis service dependencies installed.');
  } else {
    info('Analysis service dependencies already installed.');
  }
}

function setupEnv() {
  const envPath = path.join(SERVER_DIR, '.env');
  const examplePath = path.join(SERVER_DIR, '.env.example');
  if (!fs.existsSync(envPath)) {
    warning('server/.env not found.');
    if (fs.existsSync(examplePath)) {
      fs.copyFileSync(examplePath, envPath);
      success('Created server/.env from .env.example');
    } else {
      fs.writeFileSync(envPath, `PORT=${BACKEND_PORT}\n`);
      success('Created default server/.env (PORT only - add DB/secret vars here if your backend needs them)');
    }
  } else {
    info('server/.env exists.');
  }
}

function openBrowser(url) {
  const cmd = isWin
    ? `start "" "${url}"`
    : process.platform === 'darwin'
      ? `open "${url}"`
      : `xdg-open "${url}"`;
  exec(cmd, (err) => {
    if (err) warning(`Could not open browser automatically - open ${url} manually`);
  });
}

async function startService(command, args, cwd, port, label) {
  if (await checkPort(port)) {
    warning(`Something is already responding on port ${port} - assuming ${label} is already running, skipping start.`);
    return null;
  }
  info(`Starting ${label} (port ${port})...`);
  const child = spawn(command, args, { cwd, stdio: 'inherit', shell: isWin });
  children.push(child);

  const ready = await waitForPort(port, label);
  if (!ready) {
    error(`${label} failed to start - check the output above for the actual error.`);
    process.exit(1);
  }
  return child;
}

(async () => {
  info('=====================================');
  info('Crime Reporting & Analysis System');
  info('=====================================');

  info(`Node.js ${process.version}`);
  try {
    const npmV = spawnSync(npmCmd, ['--version'], { shell: isWin }).stdout.toString().trim();
    info(`npm ${npmV}`);
  } catch (_) { /* non-fatal, just skip the version line */ }

  const hasAnalysis = fs.existsSync(ANALYSIS_DIR);
  const pythonBin = hasAnalysis ? findPython() : null;
  if (hasAnalysis && !pythonBin) {
    warning('analysis/ folder found but no Python interpreter on PATH - that service will be skipped.');
  }
  info('');

  info('Checking dependencies...');
  installIfNeeded(SERVER_DIR, 'Backend');
  installIfNeeded(CLIENT_DIR, 'Frontend');
  if (hasAnalysis && pythonBin) setupAnalysisEnv(pythonBin);
  info('');

  info('Checking server/.env...');
  setupEnv();
  info('');

  const uploadsDir = path.join(PROJECT_DIR, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    info('Creating uploads/ folder...');
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  await startService(npmCmd, ['start'], SERVER_DIR, BACKEND_PORT, 'Backend');
  info('');
  await startService(npmCmd, ['run', 'dev'], CLIENT_DIR, FRONTEND_PORT, 'Frontend');
  info('');

  let analysisStarted = false;
  if (hasAnalysis && pythonBin) {
    const { python } = venvPaths(ANALYSIS_DIR);
    await startService(python, ['app.py'], ANALYSIS_DIR, ANALYSIS_PORT, 'Analysis service');
    analysisStarted = true;
    info('');
  }

  if (!NO_BROWSER) {
    info(`Opening browser at http://localhost:${FRONTEND_PORT}...`);
    openBrowser(`http://localhost:${FRONTEND_PORT}`);
  }

  info('');
  success('All services running. Press Ctrl+C to stop (this also cleans up every process).');
  info(`Backend:  http://localhost:${BACKEND_PORT}`);
  info(`Frontend: http://localhost:${FRONTEND_PORT}`);
  if (analysisStarted) info(`Analysis: http://localhost:${ANALYSIS_PORT}`);
})();
