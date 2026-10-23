import { buildApp } from './app.js';
import { startOwnerPromote } from './ops/promote-owner-once.js';
import { wipeFakeMarketplaceOnce } from './ops/wipe-fake-data-once.js';

async function main() {
  const { app, env } = await buildApp();

  try {
    await wipeFakeMarketplaceOnce(app.log);
    await app.listen({ port: env.PORT, host: env.HOST });
    startOwnerPromote(app.log);
    app.log.info(
      { port: env.PORT, region: env.DEPLOYMENT_REGION },
      'PeaLuna API started',
    );
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
