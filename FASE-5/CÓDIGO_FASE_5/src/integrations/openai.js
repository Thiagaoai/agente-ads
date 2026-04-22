import OpenAI from 'openai';
import config from '../config.js';
import logger from '../utils/logger.js';

const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

export const generateText = async (prompt, options = {}) => {
  try {
    const response = await openai.chat.completions.create({
      model: config.openai.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: options.temperature ?? config.openai.temperature,
      max_tokens: options.maxTokens ?? config.openai.maxTokens,
    });
    return response.choices[0].message.content;
  } catch (error) {
    logger.error('OpenAI text generation failed', error);
    throw error;
  }
};

export const generateImage = async (prompt, options = {}) => {
  try {
    const response = await openai.images.generate({
      model: config.openai.imageModel,
      prompt,
      size: options.size || '1024x1024',
      quality: options.quality || 'hd',
      n: options.count || 1,
    });
    return response.data.map((img) => img.url);
  } catch (error) {
    logger.error('OpenAI image generation failed', error);
    throw error;
  }
};

export const analyzeContent = async (content, contentType) => {
  try {
    const prompt = `You are a marketing compliance expert. Analyze this ${contentType} for brand alignment on a scale 1-10. Return ONLY a JSON object: {"score": number, "violations": string[], "warnings": string[]}.

Content:
${content}`;

    const response = await openai.chat.completions.create({
      model: config.openai.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 500,
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    logger.error('OpenAI content analysis failed', error);
    throw error;
  }
};

export default openai;
