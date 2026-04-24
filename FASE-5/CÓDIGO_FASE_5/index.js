import http from 'node:http';
import cron from 'node-cron';
import config from './src/config.js';
import logger from './src/utils/logger.js';
import { registerAgents } from './src/agents/registry.js';
import { startTelegramBot } from './src/telegram/bot.js';

const startedAt = new Date();
const agents = await registerAgents();
const scheduledJobs = [];

for (const [name, agent] of Object.entries(agents)) {
  const cronExpr = config.scheduling[name];
  if (!cronExpr || cronExpr === 'onDemand') continue;

  if (!cron.validate(cronExpr)) {
    logger.warn(`Invalid cron for ${name}: ${cronExpr} — skipped`);
    continue;
  }

  const job = cron.schedule(cronExpr, async () => {
    const runId = `${name}-${Date.now()}`;
    logger.info({ runId, agent: name }, 'agent.run.start');
    try {
      await agent.run();
      logger.info({ runId, agent: name }, 'agent.run.ok');
    } catch (err) {
      logger.error({ runId, agent: name, err: err.message }, 'agent.run.fail');
    }
  });

  scheduledJobs.push({ name, job, cron: cronExpr });
  logger.info(`[scheduler] ${name} armed · ${cronExpr}`);
}

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    const uptime = Math.floor((Date.now() - startedAt.getTime()) / 1000);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      uptime_seconds: uptime,
      agents_registered: Object.keys(agents).length,
      jobs_scheduled: scheduledJobs.length,
      client_id: process.env.CLIENT_ID || 'unset',
      started_at: startedAt.toISOString(),
    }));
    return;
  }

  if (req.url === '/agents') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      agents: Object.keys(agents).map((name) => ({
        name,
        cron: config.scheduling[name] ?? null,
        status: agents[name].status ?? 'idle',
      })),
    }));
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(config.ports.cmo, () => {
  logger.info(`[CMO] Port ${config.ports.cmo} up · ${Object.keys(agents).length} agents registered · ${scheduledJobs.length} jobs armed`);
});

startTelegramBot(agents).catch((err) => {
  logger.error({ err: err.message }, 'telegram.bot.fail');
});

const shutdown = (signal) => {
  logger.info(`[CMO] ${signal} received · shutting down`);
  scheduledJobs.forEach(({ job }) => job.stop());
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (err) => {
  logger.error({ err: err?.message }, 'unhandledRejection');
});
