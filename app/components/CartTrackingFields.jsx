import {useEffect, useState} from 'react';

const VISITOR_ID_STORAGE_KEY = 'storefront-visitor-id';

function readCookie(name) {
  if (typeof document === 'undefined') return null;

  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${escapedName}=([^;]*)`),
  );

  return match ? decodeURIComponent(match[1]) : null;
}

function getOrCreateVisitorId() {
  if (typeof window === 'undefined') return null;

  const storedVisitorId = window.localStorage.getItem(VISITOR_ID_STORAGE_KEY);
  if (storedVisitorId) {
    return storedVisitorId;
  }

  const generatedVisitorId =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `vid-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  window.localStorage.setItem(VISITOR_ID_STORAGE_KEY, generatedVisitorId);
  return generatedVisitorId;
}

function collectTrackingFields() {
  if (typeof window === 'undefined') {
    return {};
  }

  const params = new URLSearchParams(window.location.search);
  const language = document.documentElement.lang || window.navigator.language;

  return {
    country: params.get('country') || '',
    fbp: params.get('fbp') || readCookie('_fbp') || readCookie('fbp') || '',
    host: window.location.host || '',
    locale: params.get('locale') || language || '',
    sh: String(window.screen?.height || ''),
    sw: String(window.screen?.width || ''),
    ttp: params.get('ttp') || readCookie('_ttp') || readCookie('ttp') || '',
    vid: params.get('vid') || readCookie('vid') || getOrCreateVisitorId() || '',
  };
}

export function CartTrackingFields() {
  const [fields, setFields] = useState(() => collectTrackingFields());

  useEffect(() => {
    setFields(collectTrackingFields());
  }, []);

  return (
    <>
      <input type="hidden" name="country" value={fields.country || ''} />
      <input type="hidden" name="fbp" value={fields.fbp || ''} />
      <input type="hidden" name="host" value={fields.host || ''} />
      <input type="hidden" name="locale" value={fields.locale || ''} />
      <input type="hidden" name="sh" value={fields.sh || ''} />
      <input type="hidden" name="sw" value={fields.sw || ''} />
      <input type="hidden" name="ttp" value={fields.ttp || ''} />
      <input type="hidden" name="vid" value={fields.vid || ''} />
    </>
  );
}
