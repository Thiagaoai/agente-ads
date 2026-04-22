import axios from 'axios';
import config from '../config.js';
import logger from '../utils/logger.js';

const semrushAPI = axios.create({
  baseURL: 'https://api.semrush.com',
  timeout: 15000,
});

export const keywords = {
  getMetrics: async (keyword, database = 'us') => {
    try {
      const response = await semrushAPI.get('/', {
        params: {
          type: 'phrase_metrics',
          key: config.semrush.apiKey,
          phrase: keyword,
          database,
          export_columns: 'Ph,Nq,Cp,Co,Nr,Td',
        },
      });

      const lines = response.data.trim().split('\n');
      if (lines.length < 2) {
        return null;
      }

      const data = lines[1].split('|');
      return {
        keyword,
        searchVolume: parseInt(data[1]) || 0,
        keywordDifficulty: parseFloat(data[2]) || 0,
        cpc: parseFloat(data[3]) || 0,
        competitionLevel: data[4] || 'low',
        resultsCount: parseInt(data[5]) || 0,
        trendData: null,
        updatedAt: new Date(),
      };
    } catch (error) {
      logger.error('Failed to fetch Semrush keyword metrics', error);
      throw error;
    }
  },

  getRankData: async (domain, keyword, database = 'us') => {
    try {
      const response = await semrushAPI.get('/', {
        params: {
          type: 'domain_rank',
          key: config.semrush.apiKey,
          domain,
          keyword,
          database,
          export_columns: 'Po,Kd,Tr,V',
        },
      });

      const lines = response.data.trim().split('\n');
      if (lines.length < 2) {
        return null;
      }

      const data = lines[1].split('|');
      return {
        domain,
        keyword,
        rank: parseInt(data[0]) || null,
        keywordDifficulty: parseFloat(data[1]) || 0,
        trafficValue: parseInt(data[2]) || 0,
        searchVolume: parseInt(data[3]) || 0,
        checkedAt: new Date(),
      };
    } catch (error) {
      logger.error('Failed to fetch Semrush rank data', error);
      throw error;
    }
  },

  getBacklinks: async (domain) => {
    try {
      const response = await semrushAPI.get('/', {
        params: {
          type: 'backlinks',
          key: config.semrush.apiKey,
          target: domain,
          export_columns: 'Dn,Url,Anchor,Type',
          display_limit: 10,
        },
      });

      const lines = response.data.trim().split('\n').slice(1);
      return lines.map((line) => {
        const data = line.split('|');
        return {
          referrerDomain: data[0],
          referrerUrl: data[1],
          anchorText: data[2],
          backLinkType: data[3],
        };
      });
    } catch (error) {
      logger.error('Failed to fetch Semrush backlinks', error);
      throw error;
    }
  },

  getCompetitors: async (domain, database = 'us') => {
    try {
      const response = await semrushAPI.get('/', {
        params: {
          type: 'domain_competitors',
          key: config.semrush.apiKey,
          domain,
          database,
          export_columns: 'Dn,Rank',
        },
      });

      const lines = response.data.trim().split('\n').slice(1);
      return lines.map((line) => {
        const data = line.split('|');
        return {
          competitorDomain: data[0],
          similarityRank: parseInt(data[1]) || 0,
        };
      });
    } catch (error) {
      logger.error('Failed to fetch Semrush competitors', error);
      throw error;
    }
  },

  getOrganic: async (domain, database = 'us') => {
    try {
      const response = await semrushAPI.get('/', {
        params: {
          type: 'domain_organic',
          key: config.semrush.apiKey,
          domain,
          database,
          export_columns: 'Ph,Po,Tr,V',
          display_limit: 20,
        },
      });

      const lines = response.data.trim().split('\n').slice(1);
      return lines.map((line) => {
        const data = line.split('|');
        return {
          keyword: data[0],
          rank: parseInt(data[1]) || 0,
          trafficValue: parseInt(data[2]) || 0,
          searchVolume: parseInt(data[3]) || 0,
        };
      });
    } catch (error) {
      logger.error('Failed to fetch Semrush organic keywords', error);
      throw error;
    }
  },
};

export default semrushAPI;
