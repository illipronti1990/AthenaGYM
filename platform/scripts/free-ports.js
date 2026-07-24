#!/usr/bin/env node
/** Free localhost ports used by ATHENAS platform (3000 web, 3001 api). */
const { execSync } = require('child_process');

const ports = process.argv.slice(2).map(Number).filter(Boolean);
const targets = ports.length ? ports : [3000, 3001];

function pidsOnPort(port) {
  try {
    const out = execSync('netstat -ano', { encoding: 'utf8' });
    const re = new RegExp(`:${port}\\s+.*LISTENING\\s+(\\d+)`, 'gi');
    const ids = new Set();
    let m;
    while ((m = re.exec(out))) ids.add(m[1]);
    return [...ids];
  } catch {
    return [];
  }
}

for (const port of targets) {
  for (const pid of pidsOnPort(port)) {
    if (!pid || pid === '0') continue;
    try {
      execSync(`taskkill /F /PID ${pid}`, { stdio: 'inherit' });
      console.log(`Freed :${port} (PID ${pid})`);
    } catch {
      console.warn(`Could not kill PID ${pid} on :${port}`);
    }
  }
}

const still = targets.flatMap((p) => pidsOnPort(p).map((id) => `${p}:${id}`));
if (still.length === 0) console.log('OK — ports free:', targets.join(', '));
else console.warn('Still in use:', still.join(', '));
