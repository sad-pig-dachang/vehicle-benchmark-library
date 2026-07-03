import dotenv from 'dotenv';

dotenv.config();

const env = process.env;

export const config = {
  port: Number(env.PORT || env.SERVER_PORT || 8787),
  feishu: {
    appId: env.FEISHU_APP_ID || '',
    appSecret: env.FEISHU_APP_SECRET || '',
    baseAppToken: env.BASE_APP_TOKEN || env.FEISHU_BASE_APP_TOKEN || '',
    wikiNodeToken: env.WIKI_NODE_TOKEN || env.FEISHU_WIKI_NODE_TOKEN || '',
    tables: {
      vehicle: env.VEHICLE_TABLE_ID || env.FEISHU_VEHICLE_TABLE_ID || '',
      specs: env.SPECS_TABLE_ID || '',
      benchmark: env.BENCHMARK_TABLE_ID || '',
      media: env.MEDIA_TABLE_ID || '',
      discussion: env.DISCUSSION_TABLE_ID || env.FEISHU_DISCUSSION_TABLE_ID || '',
      version: env.VERSION_TABLE_ID || env.FEISHU_VERSION_LOG_TABLE_ID || '',
      l1Market: env.L1_MARKET_TABLE_ID || '',
      l2Profile: env.L2_PROFILE_TABLE_ID || '',
      l3Scenes: env.L3_SCENE_TABLE_ID || '',
      l3Features: env.L3_FEATURE_TABLE_ID || '',
      l3Styling: env.L3_STYLING_TABLE_ID || '',
      l4Design: env.L4_DESIGN_TABLE_ID || '',
      l5Trace: env.L5_TRACE_TABLE_ID || '',
    },
  },
};

export function requireFeishuConfig() {
  const missing = [];
  if (!config.feishu.appId) missing.push('FEISHU_APP_ID');
  if (!config.feishu.appSecret) missing.push('FEISHU_APP_SECRET');
  if (!config.feishu.baseAppToken && !config.feishu.wikiNodeToken) {
    missing.push('BASE_APP_TOKEN or WIKI_NODE_TOKEN');
  }

  if (missing.length) {
    throw new Error(`Missing Feishu environment variables: ${missing.join(', ')}`);
  }
}
