const DEFAULT_CHECKOUT_DOMAIN = 'www.961souq.com';

export const normalizeHostname = (value) => {
  if (!value) return null;

  const normalizedValue = /^[a-z]+:\/\//i.test(value)
    ? value
    : `https://${value}`;

  try {
    return new URL(normalizedValue).hostname.replace(/\.$/, '').toLowerCase();
  } catch {
    return null;
  }
};

const getFallbackCheckoutDomain = (requestUrl) => {
  const requestHost = normalizeHostname(requestUrl);

  if (!requestHost) return DEFAULT_CHECKOUT_DOMAIN;
  if (requestHost === '961souq.com' || requestHost === DEFAULT_CHECKOUT_DOMAIN) {
    return DEFAULT_CHECKOUT_DOMAIN;
  }
  if (
    requestHost === 'localhost' ||
    requestHost.endsWith('.myshopify.dev') ||
    /^[\d.]+$/.test(requestHost)
  ) {
    return DEFAULT_CHECKOUT_DOMAIN;
  }
  if (requestHost.endsWith('.myshopify.com')) {
    return requestHost;
  }

  return requestHost.startsWith('www.') ? requestHost : `www.${requestHost}`;
};

export const resolveCheckoutDomain = (configuredCheckoutDomain, requestUrl) => {
  return (
    normalizeHostname(configuredCheckoutDomain) ||
    getFallbackCheckoutDomain(requestUrl)
  );
};

export const getAnalyticsCookieDomain = (...domains) => {
  const hosts = domains.map(normalizeHostname).filter(Boolean);
  if (!hosts.length) return undefined;

  const sharedHost = hosts.reduce((currentHost, host) => {
    if (!currentHost) return null;
    if (currentHost === host) return currentHost;
    if (host.endsWith(`.${currentHost}`)) return currentHost;
    if (currentHost.endsWith(`.${host}`)) return host;
    return null;
  });

  if (
    !sharedHost ||
    sharedHost === 'localhost' ||
    /^[\d.]+$/.test(sharedHost)
  ) {
    return undefined;
  }

  return `.${sharedHost}`;
};
