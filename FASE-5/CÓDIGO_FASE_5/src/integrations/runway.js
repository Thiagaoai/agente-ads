import axios from 'axios';
import config from '../config.js';
import logger from '../utils/logger.js';

const runwayAPI = axios.create({
  baseURL: 'https://api.runwayml.com/v1',
  headers: {
    Authorization: `Bearer ${config.runway.apiKey}`,
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

export const videos = {
  generate: async (videoData) => {
    try {
      const response = await runwayAPI.post('/image_to_video', {
        model: 'gen3',
        promptImage: videoData.promptImage,
        promptText: videoData.promptText || '',
        duration: videoData.duration || 4,
        fps: videoData.fps || 24,
        watermark: false,
      });
      return {
        taskId: response.data.id,
        status: response.data.status,
        createdAt: new Date(),
      };
    } catch (error) {
      logger.error('Failed to generate video with Runway', error);
      throw error;
    }
  },

  getStatus: async (taskId) => {
    try {
      const response = await runwayAPI.get(`/tasks/${taskId}`);
      return {
        taskId: response.data.id,
        status: response.data.status,
        progress: response.data.progress || 0,
        videoUrl: response.data.output?.[0] || null,
        error: response.data.error || null,
      };
    } catch (error) {
      logger.error('Failed to fetch Runway video status', error);
      throw error;
    }
  },

  cancel: async (taskId) => {
    try {
      const response = await runwayAPI.post(`/tasks/${taskId}/cancel`);
      return {
        taskId: response.data.id,
        status: response.data.status,
      };
    } catch (error) {
      logger.error('Failed to cancel Runway video generation', error);
      throw error;
    }
  },
};

export const images = {
  enhance: async (imageData) => {
    try {
      const response = await runwayAPI.post('/image_upscale', {
        image: imageData.imageUrl,
        upscaleMultiplier: imageData.upscaleMultiplier || 2,
      });
      return {
        taskId: response.data.id,
        status: response.data.status,
      };
    } catch (error) {
      logger.error('Failed to enhance image with Runway', error);
      throw error;
    }
  },
};

export default runwayAPI;
