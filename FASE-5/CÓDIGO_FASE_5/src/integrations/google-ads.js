import axios from 'axios';
import config from '../config.js';
import logger from '../utils/logger.js';

const API_VERSION = 'v17';
const BASE_URL = `https://googleads.googleapis.com/${API_VERSION}`;

let cachedToken = null;
let cachedExpiry = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < cachedExpiry) return cachedToken;

  const response = await axios.post('https://oauth2.googleapis.com/token', {
    client_id: config.googleAds.clientId,
    client_secret: config.googleAds.clientSecret,
    refresh_token: config.googleAds.refreshToken,
    grant_type: 'refresh_token',
  });

  cachedToken = response.data.access_token;
  cachedExpiry = Date.now() + (response.data.expires_in - 60) * 1000;
  return cachedToken;
}

async function googleAdsRequest(path, body = null, method = 'POST') {
  const accessToken = await getAccessToken();
  const customerId = config.googleAds.customerId;
  const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || customerId;

  const url = `${BASE_URL}/customers/${customerId}${path}`;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'developer-token': config.googleAds.developerToken,
    'login-customer-id': loginCustomerId,
    'Content-Type': 'application/json',
  };

  try {
    const response = await axios({ method, url, headers, data: body });
    return response.data;
  } catch (err) {
    logger.error({
      path,
      status: err.response?.status,
      err: err.response?.data?.error?.message || err.message,
    }, 'google-ads.request.fail');
    throw err;
  }
}

export const campaigns = {
  create: async ({ name, daily_budget_micros, bid_strategy }) => {
    const budgetOp = {
      operations: [{
        create: {
          name: `${name}-budget`,
          amount_micros: daily_budget_micros ?? config.agents.googleAdsAgent.dailyBudgetMicros,
          delivery_method: 'STANDARD',
        },
      }],
    };
    const budget = await googleAdsRequest('/campaignBudgets:mutate', budgetOp);
    const budgetResource = budget.results[0].resource_name;

    const campaignOp = {
      operations: [{
        create: {
          name,
          status: 'PAUSED',
          advertising_channel_type: 'SEARCH',
          campaign_budget: budgetResource,
          bidding_strategy_type: bid_strategy ?? config.agents.googleAdsAgent.bidStrategy,
        },
      }],
    };
    const camp = await googleAdsRequest('/campaigns:mutate', campaignOp);
    return { id: camp.results[0].resource_name.split('/').pop(), resource_name: camp.results[0].resource_name };
  },

  enable: async (campaignId) => {
    const op = {
      operations: [{
        update: {
          resource_name: `customers/${config.googleAds.customerId}/campaigns/${campaignId}`,
          status: 'ENABLED',
        },
        update_mask: 'status',
      }],
    };
    return googleAdsRequest('/campaigns:mutate', op);
  },

  pause: async (campaignId) => {
    const op = {
      operations: [{
        update: {
          resource_name: `customers/${config.googleAds.customerId}/campaigns/${campaignId}`,
          status: 'PAUSED',
        },
        update_mask: 'status',
      }],
    };
    return googleAdsRequest('/campaigns:mutate', op);
  },

  getMetrics: async (campaignId, dateRange = 'LAST_7_DAYS') => {
    const query = `
      SELECT campaign.name, metrics.impressions, metrics.clicks, metrics.cost_micros,
             metrics.conversions, metrics.ctr, metrics.average_cpc
      FROM campaign
      WHERE campaign.id = ${campaignId}
        AND segments.date DURING ${dateRange}
    `;
    return googleAdsRequest('/googleAds:searchStream', { query });
  },
};

export const adGroups = {
  create: async ({ campaignResourceName, name, cpc_bid_micros }) => {
    const op = {
      operations: [{
        create: {
          name,
          campaign: campaignResourceName,
          status: 'ENABLED',
          type: 'SEARCH_STANDARD',
          cpc_bid_micros: cpc_bid_micros ?? 1000000,
        },
      }],
    };
    return googleAdsRequest('/adGroups:mutate', op);
  },
};

export const keywords = {
  addToAdGroup: async (adGroupResourceName, keywordList) => {
    const operations = keywordList.map((keyword) => ({
      create: {
        ad_group: adGroupResourceName,
        status: 'ENABLED',
        keyword: { text: keyword, match_type: 'PHRASE' },
      },
    }));
    return googleAdsRequest('/adGroupCriteria:mutate', { operations });
  },
};

export default { campaigns, adGroups, keywords };
