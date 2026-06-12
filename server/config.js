import dotenv from 'dotenv';

dotenv.config();

const env = process.env;

export const config = {
  port: Number(env.PORT || env.SERVER_PORT || 8787),
  feishu: {
    appId: env.FEISHU_APP_ID || '',
    appSecret: env.FEISHU_APP_SECRET || '',
    baseAppToken: env.BASE_APP_TOKEN || env.FEISHU_BASE_APP_TOKEN || '',
    tables: {
      vehicle: env.VEHICLE_TABLE_ID || env.FEISHU_VEHICLE_TABLE_ID || '',
      specs: env.SPECS_TABLE_ID || '',
      benchmark: env.BENCHMARK_TABLE_ID || '',
      media: env.MEDIA_TABLE_ID || '',
      discussion: env.DISCUSSION_TABLE_ID || env.FEISHU_DISCUSSION_TABLE_ID || '',
      version: env.VERSION_TABLE_ID || env.FEISHU_VERSION_LOG_TABLE_ID || '',
    },
  },
};

export function requireFeishuConfig() {
  const missing = [];
  if (!config.feishu.appId) missing.push('FEISHU_APP_ID');
  if (!config.feishu.appSecret) missing.push('FEISHU_APP_SECRET');
  if (!config.feishu.baseAppToken) missing.push('BASE_APP_TOKEN');
  if (!config.feishu.tables.vehicle) missing.push('VEHICLE_TABLE_ID');
  if (!config.feishu.tables.specs) missing.push('SPECS_TABLE_ID');
  if (!config.feishu.tables.benchmark) missing.push('BENCHMARK_TABLE_ID');
  if (!config.feishu.tables.discussion) missing.push('DISCUSSION_TABLE_ID');
  if (!config.feishu.tables.version) missing.push('VERSION_TABLE_ID');

  if (missing.length) {
    throw new Error(`Missing Feishu environment variables: ${missing.join(', ')}`);
  }
}
