import { execSync } from 'node:child_process';

const PORT = process.env.PORT ?? 3002;

function findPids(port) {
  try {
    const output = execSync(`lsof -ti tcp:${port}`, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
    return output ? output.split('\n').filter(Boolean) : [];
  } catch {
    return [];
  }
}

const pids = findPids(PORT);

if (pids.length === 0) {
  console.log(`[free-port] Puerto ${PORT} libre.`);
  process.exit(0);
}

for (const pid of pids) {
  try {
    process.kill(Number(pid), 'SIGKILL');
    console.log(`[free-port] Proceso ${pid} en puerto ${PORT} terminado.`);
  } catch (error) {
    console.warn(`[free-port] No se pudo terminar el proceso ${pid}: ${error.message}`);
  }
}
