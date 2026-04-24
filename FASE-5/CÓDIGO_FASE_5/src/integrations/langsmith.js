import axios from 'axios';
import logger from '../utils/logger.js';

const LANGSMITH_API_KEY = process.env.LANGSMITH_API_KEY;
const LANGSMITH_PROJECT = process.env.LANGSMITH_PROJECT || 'marketing-squad';
const LANGSMITH_ENDPOINT = process.env.LANGSMITH_ENDPOINT || 'https://api.smith.langchain.com';

const isEnabled = () => Boolean(LANGSMITH_API_KEY);

export async function traceLLM({ agent, model, input, output, startedAt, endedAt, error }) {
  if (!isEnabled()) return;
  try {
    await axios.post(
      `${LANGSMITH_ENDPOINT}/runs`,
      {
        name: `${agent}.llm`,
        run_type: 'llm',
        project_name: LANGSMITH_PROJECT,
        extra: { metadata: { client_id: process.env.CLIENT_ID, agent, model } },
        inputs: { input },
        outputs: error ? undefined : { output },
        error,
        start_time: new Date(startedAt).toISOString(),
        end_time: new Date(endedAt || Date.now()).toISOString(),
      },
      {
        headers: { 'x-api-key': LANGSMITH_API_KEY, 'Content-Type': 'application/json' },
        timeout: 5000,
      }
    );
  } catch (err) {
    logger.warn({ err: err.message }, 'langsmith.trace.fail');
  }
}

export async function withTrace(agent, model, input, fn) {
  const startedAt = Date.now();
  try {
    const output = await fn();
    traceLLM({ agent, model, input, output, startedAt, endedAt: Date.now() }).catch(() => {});
    return output;
  } catch (err) {
    traceLLM({ agent, model, input, startedAt, endedAt: Date.now(), error: err.message }).catch(() => {});
    throw err;
  }
}
