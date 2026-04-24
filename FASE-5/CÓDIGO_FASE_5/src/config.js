import 'dotenv/config.js';

export const config = {
  // Node environment
  env: process.env.NODE_ENV || 'production',
  debug: process.env.DEBUG === 'true',

  // Ports
  ports: {
    paperclip: process.env.PAPERCLIP_PORT || 3100,
    cmo: process.env.CMO_PORT || 3200,
  },

  // Supabase
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },

  // OpenAI (GPT-4o, DALL-E 3)
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4o',
    imageModel: 'dall-e-3',
    temperature: 0.7,
    maxTokens: 4096,
  },

  // Meta Ads API (v19)
  meta: {
    accessToken: process.env.META_ACCESS_TOKEN,
    adAccountId: process.env.META_AD_ACCOUNT_ID,
    pixelId: process.env.META_PIXEL_ID,
    apiVersion: 'v19',
  },

  // Runway ML (video generation)
  runway: {
    apiKey: process.env.RUNWAY_API_KEY,
    model: 'gen3',
  },

  // SEMrush (SEO)
  semrush: {
    apiKey: process.env.SEMRUSH_API_KEY,
  },

  // Cloudinary (content storage)
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  // Google Ads API (reused from Phase 2)
  googleAds: {
    customerId: process.env.GOOGLE_ADS_CUSTOMER_ID,
    developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
    clientId: process.env.GOOGLE_ADS_CLIENT_ID,
    clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_ADS_REFRESH_TOKEN,
  },

  // Telegram (alerts & reports)
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    operatorId: process.env.TELEGRAM_OPERATOR_ID,
    channelId: process.env.TELEGRAM_CHANNEL_ID,
  },

  // Agent scheduling (cron expressions) — keys MUST match registry names
  scheduling: {
    cmo: '0 */1 * * *', // Every hour (orchestrator)
    strategist: '0 7 * * *', // Daily at 7am
    copywriter: '0 */4 * * *', // Every 4 hours
    imageCreator: '15 */4 * * *', // Every 4h (offset 15min from copy)
    videoCreator: '0 9 * * 1', // Mondays at 9am
    googleAdsAgent: '0 */2 * * *', // Every 2 hours
    metaAdsAgent: '30 */2 * * *', // Every 2h (offset 30min from google)
    seoAgent: '0 */12 * * *', // Every 12 hours
    analyticsAgent: '0 */6 * * *', // Every 6 hours
    supervisor: '30 * * * *', // Every hour (offset 30min from cmo)
    developerAgent: 'onDemand', // On-demand via Telegram
  },

  // Agent configuration
  agents: {
    supervisor: {
      approvalThreshold: 7, // 1-10 score, must be >= 7 to proceed
      maxReviewTime: 300000, // 5 minutes
      skipBrandCheck: false,
    },
    copywriter: {
      variantsPerRun: 5,
      lengthVariants: ['short', 'medium', 'long'],
      toneVariants: ['professional', 'casual', 'friendly'],
    },
    imageCreator: {
      size: '1024x1024',
      quality: 'hd',
      maxGenerationsPerRun: 3,
    },
    videoCreator: {
      durationSeconds: 15,
      fps: 24,
    },
    seoAgent: {
      trackingLimit: 50, // Max keywords to track
      updateFrequency: 86400000, // 24 hours in ms
    },
    googleAdsAgent: {
      bidStrategy: 'MAXIMIZE_CONVERSIONS',
      dailyBudgetMicros: 1000000000, // $1000/day in micros
    },
    metaAdsAgent: {
      bidStrategy: 'LOWEST_COST',
      dailyBudgetCents: 100000, // $1000/day in cents
    },
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'json',
    maxFileSize: '10m',
    maxFiles: 14, // 2 weeks
    logDir: '/var/log/marketing-squad',
  },

  // Database
  database: {
    maxConnections: 20,
    connectionTimeout: 10000,
    queryTimeout: 30000,
  },

  // Error handling
  errorHandling: {
    retryAttempts: 3,
    retryDelay: 5000, // 5 seconds
    alertOnError: true,
  },

  // Rate limiting
  rateLimiting: {
    openai: 3500, // tokens per minute
    meta: 100, // requests per hour
    runway: 10, // requests per hour
    semrush: 100, // API units per day
  },
};

export default config;
