import * as Linking from 'expo-linking';

const AUTH_CALLBACK_ROUTE = 'auth/callback';

export type AuthCallbackPayload = {
  accessToken: string | null;
  errorCode: string | null;
  errorDescription: string | null;
  refreshToken: string | null;
  type: string | null;
};

export function getAuthRedirectUrl() {
  return Linking.createURL(AUTH_CALLBACK_ROUTE);
}

export function parseAuthCallbackUrl(url: string): AuthCallbackPayload | null {
  const callbackPath = normalizeCallbackPath(url);

  if (!callbackPath.endsWith(AUTH_CALLBACK_ROUTE)) {
    return null;
  }

  const params = collectUrlParams(url);

  return {
    accessToken: params.get('access_token'),
    errorCode: params.get('error'),
    errorDescription: params.get('error_description'),
    refreshToken: params.get('refresh_token'),
    type: params.get('type'),
  };
}

function collectUrlParams(url: string) {
  const params = new URLSearchParams();
  const hashIndex = url.indexOf('#');
  const queryIndex = url.indexOf('?');

  if (queryIndex >= 0) {
    const queryEnd = hashIndex >= 0 ? hashIndex : url.length;
    appendParams(params, url.slice(queryIndex + 1, queryEnd));
  }

  if (hashIndex >= 0) {
    appendParams(params, url.slice(hashIndex + 1));
  }

  return params;
}

function appendParams(target: URLSearchParams, serializedParams: string) {
  for (const [key, value] of new URLSearchParams(serializedParams)) {
    target.set(key, value);
  }
}

function normalizeCallbackPath(url: string) {
  const parsedUrl = Linking.parse(url);

  return [parsedUrl.hostname, parsedUrl.path]
    .filter((segment): segment is string => Boolean(segment))
    .join('/')
    .replace(/^\/+|\/+$/g, '')
    .toLowerCase();
}
