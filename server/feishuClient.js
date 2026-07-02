import { config, requireFeishuConfig } from './config.js';

const FEISHU_BASE_URL = 'https://open.feishu.cn/open-apis';
const TOKEN_SAFETY_WINDOW_MS = 60 * 1000;

let cachedTenantToken = null;
let cachedTenantTokenExpiresAt = 0;
let cachedBaseAppToken = config.feishu.baseAppToken || '';

function assertOkResponse(payload, action) {
  if (payload?.code !== 0) {
    const message = payload?.msg || payload?.message || 'Unknown Feishu API error';
    throw new Error(`${action} failed: ${message}`);
  }
}

async function parseResponse(response, action) {
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(`${action} failed: HTTP ${response.status} ${text}`);
  }

  assertOkResponse(payload, action);
  return payload;
}

export async function getTenantAccessToken() {
  requireFeishuConfig();

  if (cachedTenantToken && Date.now() < cachedTenantTokenExpiresAt - TOKEN_SAFETY_WINDOW_MS) {
    return cachedTenantToken;
  }

  const response = await fetch(`${FEISHU_BASE_URL}/auth/v3/tenant_access_token/internal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({
      app_id: config.feishu.appId,
      app_secret: config.feishu.appSecret,
    }),
  });

  const payload = await parseResponse(response, 'Get tenant_access_token');
  cachedTenantToken = payload.tenant_access_token;
  cachedTenantTokenExpiresAt = Date.now() + Number(payload.expire || 0) * 1000;
  return cachedTenantToken;
}

async function feishuFetch(path, options = {}, action = 'Feishu request') {
  const token = await getTenantAccessToken();
  const response = await fetch(`${FEISHU_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8',
      ...(options.headers || {}),
    },
  });

  return parseResponse(response, action);
}

async function getBaseAppToken() {
  if (cachedBaseAppToken) {
    return cachedBaseAppToken;
  }

  const search = new URLSearchParams({ token: config.feishu.wikiNodeToken });
  const payload = await feishuFetch(
    `/wiki/v2/spaces/get_node?${search.toString()}`,
    { method: 'GET' },
    'Resolve wiki node token',
  );

  const node = payload.data?.node;
  if (!node?.obj_token) {
    throw new Error('Resolve wiki node token failed: response does not include obj_token');
  }

  if (node.obj_type && node.obj_type !== 'bitable') {
    throw new Error(`Resolve wiki node token failed: expected bitable node, received ${node.obj_type}`);
  }

  cachedBaseAppToken = node.obj_token;
  return cachedBaseAppToken;
}

async function recordsPath(tableId, recordId = '') {
  const appToken = encodeURIComponent(await getBaseAppToken());
  const encodedTableId = encodeURIComponent(tableId);
  const suffix = recordId ? `/${encodeURIComponent(recordId)}` : '';
  return `/bitable/v1/apps/${appToken}/tables/${encodedTableId}/records${suffix}`;
}

export async function listRecords(tableId) {
  const items = [];
  let pageToken = '';

  do {
    const search = new URLSearchParams({ page_size: '100' });
    if (pageToken) search.set('page_token', pageToken);

    const payload = await feishuFetch(
      `${await recordsPath(tableId)}?${search.toString()}`,
      { method: 'GET' },
      `List records from ${tableId}`,
    );

    items.push(...(payload.data?.items || []));
    pageToken = payload.data?.has_more ? payload.data?.page_token || '' : '';
  } while (pageToken);

  return items;
}

export async function listTables() {
  const items = [];
  let pageToken = '';
  const appToken = encodeURIComponent(await getBaseAppToken());

  do {
    const search = new URLSearchParams({ page_size: '100' });
    if (pageToken) search.set('page_token', pageToken);

    const payload = await feishuFetch(
      `/bitable/v1/apps/${appToken}/tables?${search.toString()}`,
      { method: 'GET' },
      'List bitable tables',
    );

    items.push(...(payload.data?.items || []));
    pageToken = payload.data?.has_more ? payload.data?.page_token || '' : '';
  } while (pageToken);

  return items;
}

export async function getRecord(tableId, recordId) {
  const payload = await feishuFetch(await recordsPath(tableId, recordId), { method: 'GET' }, `Get record ${recordId}`);
  return payload.data?.record;
}

export async function createRecord(tableId, fields) {
  const payload = await feishuFetch(
    await recordsPath(tableId),
    {
      method: 'POST',
      body: JSON.stringify({ fields }),
    },
    `Create record in ${tableId}`,
  );
  return payload.data?.record;
}

export async function updateRecord(tableId, recordId, fields) {
  const payload = await feishuFetch(
    await recordsPath(tableId, recordId),
    {
      method: 'PUT',
      body: JSON.stringify({ fields }),
    },
    `Update record ${recordId}`,
  );
  return payload.data?.record;
}

export async function deleteRecord(tableId, recordId) {
  await feishuFetch(await recordsPath(tableId, recordId), { method: 'DELETE' }, `Delete record ${recordId}`);
}
