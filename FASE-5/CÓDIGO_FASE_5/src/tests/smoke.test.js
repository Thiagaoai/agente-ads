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
  for (const name of ['cmo', 'strategist', 'copywriter', 'supervisor', 'metaAdsAgent', 'googleAdsAgent', 'imageCreator', 'videoCreator', 'seoAgent', 'analyticsAgent', 'developerAgent']) {
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

test('scheduling keys align with registry names', async () => {
  const { default: config } = await import('../config.js');
  const { registerAgents } = await import('../agents/registry.js');
  const agents = await registerAgents();
  for (const key of Object.keys(config.scheduling)) {
    assert.ok(agents[key], `scheduling key "${key}" has no matching agent in registry`);
  }
});

test('cron expressions in config are valid', async () => {
  const cron = (await import('node-cron')).default;
  const { default: config } = await import('../config.js');
  for (const [name, expr] of Object.entries(config.scheduling)) {
    if (expr === 'onDemand') continue;
    assert.ok(cron.validate(expr), `invalid cron for ${name}: ${expr}`);
  }
});

test('ImageCreator buildPrompt produces valid prompt with guidelines', async () => {
  const { ImageCreatorAgent } = await import('../agents/image-creator.js');
  const agent = new ImageCreatorAgent();
  const campaign = { platform: 'meta_ads', objective: 'conversions', audience: 'homeowners 35-55' };
  const guidelines = {
    company: { name: 'Acme' },
    voice: { tone: 'premium', keyWords: ['quality', 'innovation'] },
    visualIdentity: { primaryColors: { main: '#123', accent: '#456' } },
  };
  const prompt = agent.buildPrompt(campaign, guidelines);
  assert.match(prompt, /Acme/);
  assert.match(prompt, /premium/);
  assert.match(prompt, /quality/);
});

test('DeveloperAgent slugify is URL-safe', async () => {
  const { DeveloperAgent } = await import('../agents/developer-agent.js');
  const agent = new DeveloperAgent();
  assert.equal(agent.slugify('CONVERSIONS-abc12345'), 'conversions-abc12345');
  assert.equal(agent.slugify('  Hello World!  '), 'hello-world');
});

test('CmoAgent starts without registry and warns', async () => {
  const { CmoAgent } = await import('../agents/cmo-agent.js');
  const agent = new CmoAgent();
  assert.equal(agent.registry, null);
  const result = await agent.run();
  assert.deepEqual(result, { orchestrated: 0 });
});
