import { test } from 'node:test';
import assert from 'node:assert/strict';

test('config loads without throwing', async () => {
  const { default: config } = await import('../config.js');
  assert.ok(config);
  assert.equal(typeof config.ports.cmo, 'number');
  assert.ok(Array.isArray(Object.keys(config.scheduling)));
});

test('registry exposes 11 agents', async () => {
  const { registerAgents } = await import('../agents/registry.js');
  const agents = await registerAgents();
  assert.equal(Object.keys(agents).length, 11);
  for (const name of ['cmo', 'strategist', 'copywriter', 'supervisor', 'metaAdsAgent', 'googleAdsAgent']) {
    assert.ok(agents[name], `missing agent: ${name}`);
  }
});

test('base agent tracks status on run/fail', async () => {
  const { BaseAgent } = await import('../agents/base-agent.js');
  class OK extends BaseAgent { async execute() { return { ok: true }; } }
  class Bad extends BaseAgent { async execute() { throw new Error('boom'); } }

  const ok = new OK('ok');
  assert.equal(ok.status, 'idle');
  await ok.run();
  assert.equal(ok.status, 'idle');
  assert.equal(ok.lastError, null);

  const bad = new Bad('bad');
  await assert.rejects(bad.run(), /boom/);
  assert.equal(bad.status, 'error');
  assert.equal(bad.lastError, 'boom');
});

test('cron expressions in config are valid', async () => {
  const cron = (await import('node-cron')).default;
  const { default: config } = await import('../config.js');
  for (const [name, expr] of Object.entries(config.scheduling)) {
    if (expr === 'onDemand') continue;
    assert.ok(cron.validate(expr), `invalid cron for ${name}: ${expr}`);
  }
});

test('stub agents return { stub: true }', async () => {
  const { StrategistAgent } = await import('../agents/stubs.js');
  const a = new StrategistAgent();
  const result = await a.run();
  assert.deepEqual(result, { stub: true });
});
