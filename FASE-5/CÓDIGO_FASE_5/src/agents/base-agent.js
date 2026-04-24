import logger from '../utils/logger.js';

export class BaseAgent {
  constructor(name) {
    this.name = name;
    this.status = 'idle';
    this.lastRun = null;
    this.lastError = null;
  }

  async run(context = {}) {
    this.status = 'running';
    this.lastRun = new Date().toISOString();
    try {
      const result = await this.execute(context);
      this.status = 'idle';
      this.lastError = null;
      return result;
    } catch (err) {
      this.status = 'error';
      this.lastError = err.message;
      logger.error({ agent: this.name, err: err.message }, 'agent.execute.fail');
      throw err;
    }
  }

  async execute() {
    throw new Error(`${this.name}: execute() not implemented`);
  }
}
