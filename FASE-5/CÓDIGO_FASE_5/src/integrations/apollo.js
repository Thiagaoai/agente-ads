import axios from 'axios';
import logger from '../utils/logger.js';

const APOLLO_API_KEY = process.env.APOLLO_API_KEY;
const api = axios.create({
  baseURL: 'https://api.apollo.io/v1',
  timeout: 15000,
  headers: { 'X-Api-Key': APOLLO_API_KEY, 'Cache-Control': 'no-cache', 'Content-Type': 'application/json' },
});

export const people = {
  search: async ({ titles = [], locations = [], industries = [], perPage = 25, page = 1 } = {}) => {
    try {
      const { data } = await api.post('/mixed_people/search', {
        person_titles: titles,
        person_locations: locations,
        organization_industries: industries,
        per_page: perPage,
        page,
      });
      return data.people || [];
    } catch (err) {
      logger.error({ err: err.response?.data || err.message }, 'apollo.people.search.fail');
      throw err;
    }
  },

  enrich: async ({ email, first_name, last_name, domain } = {}) => {
    try {
      const { data } = await api.post('/people/match', { email, first_name, last_name, domain });
      return data.person || null;
    } catch (err) {
      logger.error({ err: err.response?.data || err.message }, 'apollo.people.enrich.fail');
      throw err;
    }
  },
};

export const organizations = {
  search: async ({ domains = [], industries = [], sizes = [], perPage = 25 } = {}) => {
    try {
      const { data } = await api.post('/mixed_companies/search', {
        organization_domains: domains,
        organization_industries: industries,
        organization_num_employees_ranges: sizes,
        per_page: perPage,
      });
      return data.organizations || [];
    } catch (err) {
      logger.error({ err: err.response?.data || err.message }, 'apollo.orgs.search.fail');
      throw err;
    }
  },
};
