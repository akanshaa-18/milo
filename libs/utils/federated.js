import { getConfig } from './utils.js';

let federatedContentRoot;
/* eslint-disable import/prefer-default-export */
export const getFederatedContentRoot = () => {
  const cdnWhitelistedOrigins = [
    'https://www.adobe.com',
    'https://business.adobe.com',
    'https://blog.adobe.com',
    'https://milo.adobe.com',
    'https://news.adobe.com',
  ];
  const { allowedOrigins = [], origin: configOrigin } = getConfig();
  if (federatedContentRoot) return federatedContentRoot;
  // Non milo consumers will have its origin from congig
  const origin = configOrigin || window.location.origin;

  federatedContentRoot = [...allowedOrigins, ...cdnWhitelistedOrigins].some((o) => origin.replace('.stage', '') === o)
    ? origin
    : 'https://www.adobe.com';

  if (origin.includes('localhost') || origin.includes('.hlx.')) {
    federatedContentRoot = `${origin.endsWith('.live') ? 'https://www.adobe.com/federal/' : 'https://www.stage.adobe.com/federal/'}`;
  }

  return federatedContentRoot;
};

// TODO we should match the akamai patterns /locale/federal/ at the start of the url
// and make the check more strict.
export const getFederatedUrl = (url = '') => {
  if (typeof url !== 'string' || !url.includes('/federal/')) return url;
  if (url.startsWith('/')) return `${getFederatedContentRoot()}${url}`;
  try {
    const { pathname, search, hash } = new URL(url);
    return `${getFederatedContentRoot()}${pathname}${search}${hash}`;
  } catch (e) {
    window.lana?.log(`getFederatedUrl errored parsing the URL: ${url}: ${e.toString()}`);
  }
  return url;
};
