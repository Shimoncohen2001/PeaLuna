import { buildApp } from './app.js';

async function main() {
  const { app, env } = await buildApp();

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
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
