import winston from 'winston';
import config from '../config.js';
import axios from 'axios';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom format
const customFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let meta = '';
  if (Object.keys(metadata).length > 0) {
    meta = JSON.stringify(metadata);
  }
  return `${timestamp} [${level}]: ${message} ${meta}`;
});

// Winston logger instance
const logger = winston.createLogger({
  level: config.logging.level,
  format: combine(
    colorize(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    customFormat
  ),
  defaultMeta: { service: 'marketing-squad' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: `${config.logging.logDir}/error.log`,
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: config.logging.maxFiles,
    }),
    new winston.transports.File({
      filename: `${config.logging.logDir}/combined.log`,
      maxsize: 5242880,
      maxFiles: config.logging.maxFiles,
    }),
  ],
});

// Send critical errors to Telegram
const sendTelegramAlert = async (message, error = null) => {
  if (!config.errorHandling.alertOnError) return;

  try {
    const text = error
      ? `🚨 *ERROR*\n\n${message}\n\n\`\`\`\n${error.stack || error.message}\n\`\`\``
      : `⚠️ *ALERT*\n\n${message}`;

    await axios.post(
      `https://api.telegram.org/bot${config.telegram.botToken}/sendMessage`,
      {
        chat_id: config.telegram.operatorId,
        text,
        parse_mode: 'Markdown',
      },
      { timeout: 5000 }
    );
  } catch (err) {
    console.error('Failed to send Telegram alert:', err.message);
  }
};

// Enhanced logger methods with Telegram alerts
const enhancedLogger = {
  info: (message, meta = {}) => {
    logger.info(message, meta);
  },

  warn: (message, meta = {}) => {
    logger.warn(message, meta);
  },

  error: (message, error = null, meta = {}) => {
    logger.error(message, { error: error?.message, stack: error?.stack, ...meta });
    if (config.errorHandling.alertOnError) {
      sendTelegramAlert(message, error).catch(console.error);
    }
  },

  debug: (message, meta = {}) => {
    if (config.debug) {
      logger.debug(message, meta);
    }
  },

  agentStart: (agentName) => {
    logger.info(`Agent started: ${agentName}`, { agent: agentName });
  },

  agentEnd: (agentName, result) => {
    logger.info(`Agent completed: ${agentName}`, { agent: agentName, result });
  },

  agentError: (agentName, error) => {
    logger.error(`Agent failed: ${agentName}`, error, { agent: agentName });
    sendTelegramAlert(
      `Agent *${agentName}* encountered an error and will retry`,
      error
    ).catch(console.error);
  },

  databaseQuery: (query, duration, rows = 0) => {
    if (config.debug) {
      logger.debug(`DB query executed in ${duration}ms`, {
        query: query.substring(0, 100),
        duration,
        rows,
      });
    }
  },

  apiCall: (service, endpoint, statusCode, duration) => {
    if (config.debug) {
      logger.debug(`API call: ${service} ${endpoint}`, {
        service,
        endpoint,
        status: statusCode,
        duration: `${duration}ms`,
      });
    }
  },

  campaignCreated: (campaignName, budget) => {
    logger.info(`Campaign created: ${campaignName}`, {
      campaign: campaignName,
      budget,
      action: 'campaign_created',
    });
  },

  contentApproved: (contentType, contentId, score) => {
    logger.info(`Content approved: ${contentType}`, {
      type: contentType,
      id: contentId,
      score,
      action: 'content_approved',
    });
  },

  contentRejected: (contentType, contentId, reason) => {
    logger.warn(`Content rejected: ${contentType}`, {
      type: contentType,
      id: contentId,
      reason,
      action: 'content_rejected',
    });
  },

  adLaunched: (platform, campaignId, budget) => {
    logger.info(`Ad launched on ${platform}`, {
      platform,
      campaign: campaignId,
      budget,
      action: 'ad_launched',
    });
  },

  metricsUpdated: (metric, value) => {
    logger.debug(`Metrics updated: ${metric}`, {
      metric,
      value,
      action: 'metrics_updated',
    });
  },
};

export default enhancedLogger;
