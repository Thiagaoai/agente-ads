import { createClient } from '@supabase/supabase-js';
import config from '../config.js';
import logger from '../utils/logger.js';

const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);

export const campaigns = {
  create: async (campaignData) => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .insert([campaignData])
        .select();
      if (error) throw error;
      return data[0];
    } catch (error) {
      logger.error('Failed to create campaign', error);
      throw error;
    }
  },

  getActive: async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('status', 'active');
      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to fetch active campaigns', error);
      throw error;
    }
  },

  update: async (campaignId, updates) => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .update(updates)
        .eq('id', campaignId)
        .select();
      if (error) throw error;
      return data[0];
    } catch (error) {
      logger.error('Failed to update campaign', error);
      throw error;
    }
  },
};

export const content = {
  create: async (contentData) => {
    try {
      const { data, error } = await supabase
        .from('content_pieces')
        .insert([contentData])
        .select();
      if (error) throw error;
      return data[0];
    } catch (error) {
      logger.error('Failed to create content piece', error);
      throw error;
    }
  },

  getByStatus: async (status) => {
    try {
      const { data, error } = await supabase
        .from('content_pieces')
        .select('*')
        .eq('approval_status', status);
      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to fetch content pieces', error);
      throw error;
    }
  },

  update: async (contentId, updates) => {
    try {
      const { data, error } = await supabase
        .from('content_pieces')
        .update(updates)
        .eq('id', contentId)
        .select();
      if (error) throw error;
      return data[0];
    } catch (error) {
      logger.error('Failed to update content piece', error);
      throw error;
    }
  },
};

export const adSets = {
  create: async (adSetData) => {
    try {
      const { data, error } = await supabase
        .from('ad_sets')
        .insert([adSetData])
        .select();
      if (error) throw error;
      return data[0];
    } catch (error) {
      logger.error('Failed to create ad set', error);
      throw error;
    }
  },

  getByPlatform: async (platform) => {
    try {
      const { data, error } = await supabase
        .from('ad_sets')
        .select('*')
        .eq('platform', platform)
        .eq('status', 'active');
      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to fetch ad sets', error);
      throw error;
    }
  },

  updateMetrics: async (adSetId, metrics) => {
    try {
      const { data, error } = await supabase
        .from('ad_sets')
        .update({ metrics, updated_at: new Date() })
        .eq('id', adSetId)
        .select();
      if (error) throw error;
      return data[0];
    } catch (error) {
      logger.error('Failed to update ad set metrics', error);
      throw error;
    }
  },
};

export const approvals = {
  create: async (approvalData) => {
    try {
      const { data, error } = await supabase
        .from('approvals')
        .insert([approvalData])
        .select();
      if (error) throw error;
      return data[0];
    } catch (error) {
      logger.error('Failed to create approval record', error);
      throw error;
    }
  },

  getLatest: async (limit = 5) => {
    try {
      const { data, error } = await supabase
        .from('approvals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to fetch approval records', error);
      throw error;
    }
  },
};

export const analytics = {
  createReport: async (reportData) => {
    try {
      const { data, error } = await supabase
        .from('analytics_reports')
        .insert([reportData])
        .select();
      if (error) throw error;
      return data[0];
    } catch (error) {
      logger.error('Failed to create analytics report', error);
      throw error;
    }
  },

  getToday: async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('analytics_reports')
        .select('*')
        .eq('report_date', today);
      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to fetch today analytics', error);
      throw error;
    }
  },
};

export const seoKeywords = {
  upsert: async (keywords) => {
    try {
      const { data, error } = await supabase
        .from('seo_keywords')
        .upsert(keywords, { onConflict: 'keyword' })
        .select();
      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to upsert keywords', error);
      throw error;
    }
  },

  getTracked: async () => {
    try {
      const { data, error } = await supabase
        .from('seo_keywords')
        .select('*')
        .eq('status', 'tracking');
      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to fetch tracked keywords', error);
      throw error;
    }
  },
};

export const marketingLeads = {
  sync: async (leadsData) => {
    try {
      const { data, error } = await supabase
        .from('marketing_leads')
        .upsert(leadsData, { onConflict: 'original_lead_id' })
        .select();
      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to sync marketing leads', error);
      throw error;
    }
  },

  getForRetargeting: async () => {
    try {
      const { data, error } = await supabase
        .from('marketing_leads')
        .select('*')
        .eq('status', 'qualified');
      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to fetch retargeting leads', error);
      throw error;
    }
  },
};

export { supabase };
export default supabase;
