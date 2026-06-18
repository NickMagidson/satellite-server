const SPACE_TRACK_BASE_URL = 'https://www.space-track.org';
const DEFAULT_EPOCH_DAYS_BACK = 30;
const DEFAULT_ORDER_BY = 'norad_cat_id asc';

export interface SpaceTrackCredentials {
  identity: string;
  password: string;
}

export interface SpaceTrackGpQueryOptions {
  epochDaysBack?: number;
  limit?: number;
  orderBy?: string;
}

interface FetchSpaceTrackGpOmmsOptions extends SpaceTrackGpQueryOptions {
  credentials: SpaceTrackCredentials;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

function assertPositiveInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }
}

function encodePathValue(value: string): string {
  return encodeURIComponent(value).replace(/%20/g, '%20');
}

export function buildGpQueryPath({
  epochDaysBack = DEFAULT_EPOCH_DAYS_BACK,
  limit,
  orderBy = DEFAULT_ORDER_BY,
}: SpaceTrackGpQueryOptions = {}): string {
  assertPositiveInteger(epochDaysBack, 'epochDaysBack');

  if (limit !== undefined) {
    assertPositiveInteger(limit, 'limit');
  }

  const segments = [
    'basicspacedata',
    'query',
    'class',
    'gp',
    'format',
    'json',
    'decay_date',
    'null-val',
    'epoch',
    encodePathValue(`>now-${epochDaysBack}`),
  ];

  if (limit !== undefined) {
    segments.push('limit', String(limit));
  }

  if (orderBy.trim() !== '') {
    segments.push('orderby', encodePathValue(orderBy));
  }

  return `/${segments.join('/')}/`;
}

function extractCookieHeader(headers: Headers): string {
  const headersWithGetSetCookie = headers as Headers & {
    getSetCookie?: () => string[];
  };
  const rawCookies = headersWithGetSetCookie.getSetCookie?.() ?? [];
  const setCookie = headers.get('set-cookie');

  if (rawCookies.length === 0 && setCookie) {
    rawCookies.push(setCookie);
  }

  const cookies = rawCookies
    .map((cookie) => {
      const [sessionCookie = ''] = cookie.split(';');
      return sessionCookie;
    })
    .filter((cookie) => cookie.trim() !== '');

  if (cookies.length === 0) {
    throw new Error('Space-Track login did not return a session cookie.');
  }

  return cookies.join('; ');
}

async function readErrorResponse(response: Response): Promise<string> {
  const body = await response.text();
  return body.trim() === '' ? response.statusText : body;
}

export async function fetchSpaceTrackGpOmms({
  credentials,
  baseUrl = SPACE_TRACK_BASE_URL,
  fetchImpl = fetch,
  ...queryOptions
}: FetchSpaceTrackGpOmmsOptions): Promise<unknown> {
  const loginResponse = await fetchImpl(`${baseUrl}/ajaxauth/login`, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      identity: credentials.identity,
      password: credentials.password,
    }),
  });

  if (!loginResponse.ok) {
    throw new Error(`Space-Track login failed: ${await readErrorResponse(loginResponse)}`);
  }

  const cookie = extractCookieHeader(loginResponse.headers);
  const gpResponse = await fetchImpl(`${baseUrl}${buildGpQueryPath(queryOptions)}`, {
    headers: {
      cookie,
    },
  });

  if (!gpResponse.ok) {
    throw new Error(`Space-Track GP query failed: ${await readErrorResponse(gpResponse)}`);
  }

  return gpResponse.json();
}
