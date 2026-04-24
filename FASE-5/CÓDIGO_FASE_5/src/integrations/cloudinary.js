import crypto from 'node:crypto';
import axios from 'axios';
import config from '../config.js';
import logger from '../utils/logger.js';

const { cloudName, apiKey, apiSecret } = config.cloudinary;

function signParams(params) {
  const sorted = Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== null && k !== 'file' && k !== 'api_key' && k !== 'signature')
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return crypto.createHash('sha256').update(sorted + apiSecret).digest('hex');
}

export async function uploadFromUrl(url, { folder = 'marketing-squad', publicId, tags = [] } = {}) {
  const timestamp = Math.floor(Date.now() / 1000);
  const params = {
    file: url,
    timestamp,
    folder,
    ...(publicId && { public_id: publicId }),
    ...(tags.length && { tags: tags.join(',') }),
  };
  params.signature = signParams(params);
  params.api_key = apiKey;

  try {
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      params
    );
    return {
      publicId: response.data.public_id,
      url: response.data.secure_url,
      bytes: response.data.bytes,
      format: response.data.format,
      width: response.data.width,
      height: response.data.height,
    };
  } catch (err) {
    logger.error({
      err: err.response?.data?.error?.message || err.message,
    }, 'cloudinary.upload.fail');
    throw err;
  }
}

export async function deleteAsset(publicId) {
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { public_id: publicId, timestamp };
  params.signature = signParams(params);
  params.api_key = apiKey;

  try {
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
      params
    );
    return response.data;
  } catch (err) {
    logger.error({ publicId, err: err.message }, 'cloudinary.delete.fail');
    throw err;
  }
}

export default { uploadFromUrl, deleteAsset };
