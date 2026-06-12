import { config } from './config.js';
import { getTenantAccessToken, listRecords } from './feishuClient.js';

async function main() {
  console.log('Checking Feishu backend configuration...');

  const token = await getTenantAccessToken();
  console.log(`tenant_access_token ok: ${token.slice(0, 8)}...`);

  const records = await listRecords(config.feishu.tables.vehicle);
  console.log(`vehicle table ok: ${records.length} record(s)`);

  console.log('Deployment check passed.');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
