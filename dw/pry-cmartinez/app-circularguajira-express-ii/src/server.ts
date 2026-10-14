import { App } from './config/index';

async function main() {
    const app = new App();
    await app.listen();
}

// Startup errors (no database, pending migrations) end the process with a clear message.
main().catch((error: unknown) => {
    console.error(`❌ Startup failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
});
