import {json} from '@shopify/remix-oxygen';
import {sha256} from 'js-sha256';

// Helper to trim/lowercase before hashing (for email)
function sha256Hash(value) {
  if (!value) return '';
  const cleaned = value.trim().toLowerCase();
  return sha256(cleaned);
}

// Normalize and hash phone: keep digits only
function sha256Phone(value) {
  if (!value) return '';
  const digits = String(value).replace(/\D+/g, '');
  return sha256(digits);
}

// Country: two-letter ISO, lowercased, then SHA-256 for CAPI
function sha256Country(value) {
  if (!value) return '';
  const cc = String(value).trim().toLowerCase().slice(0, 2);
  if (!/^[a-z]{2}$/.test(cc)) return '';
  return sha256(cc);
}

// Take first IP if list
function firstIp(ipHeader) {
  if (!ipHeader) return '';
  return String(ipHeader).split(',')[0].trim();
}

// --- fbc helpers (format fb.1.<ts>.<fbclid>) ---
function parseFbc(fbc) {
  const m = /^fb\.1\.(\d+)\.(.+)$/.exec(fbc || '');
  return m ? {ts: parseInt(m[1], 10), fbclid: m[2]} : null;
}
function isFbcExpired(ts) {
  const now = Math.floor(Date.now() / 1000);
  return now - ts > 90 * 24 * 60 * 60; // 90 days
}
function extractFbclid(url) {
  try {
    const u = new URL(url);
    return u.searchParams.get('fbclid') || '';
  } catch {
    return '';
  }
}

export async function action({request, context}) {
  if (request.method !== 'POST') {
    return json({error: 'Method Not Allowed'}, {status: 405});
  }

  try {
    // 1) Get event data from the client
    const eventData = await request.json();

    // 2) Request headers (Shopify Oxygen & Cloudflare)
    const ipHeader =
      firstIp(request.headers.get('x-forwarded-for')) ||
      request.headers.get('client-ip') ||
      request.headers.get('cf-connecting-ip') ||
      '';
    const userAgentHeader = request.headers.get('user-agent') || '';
    const refererHeader = request.headers.get('referer') || '';

    // 3) Ensure event_source_url early (we may derive fbc from it)
    if (!eventData.event_source_url) {
      eventData.event_source_url =
        (eventData.custom_data && eventData.custom_data.URL) ||
        refererHeader ||
        '';
    }

    // 4) Hash PII (email/phone) if present; manage country and fbc
    const userData = eventData.user_data || {};

    // email / phone hashing
    if (userData.email) {
      userData.em = sha256Hash(userData.email);
      delete userData.email;
    }
    if (userData.phone) {
      userData.ph = sha256Phone(userData.phone);
      delete userData.phone;
    }

    // Country precedence: payload (customer address) → headers; never default to US
    const payloadCountryRaw =
      (eventData.user_data && eventData.user_data.country) || '';
    const oxyCountry = request.headers.get('oxygen-buyer-country') || '';
    const cfCountry =
      request.headers.get('cf-ipcountry') ||
      request.headers.get('x-vercel-ip-country') ||
      '';
    const norm = (v) =>
      /^[A-Za-z]{2}/.test(String(v || ''))
        ? String(v).slice(0, 2).toLowerCase()
        : '';

    const payloadCountry = norm(payloadCountryRaw);
    const headerCountry = norm(oxyCountry || cfCountry || '');
    let chosenCountry = payloadCountry || headerCountry || '';
    if (!payloadCountry && chosenCountry === 'us') chosenCountry = '';

    if (chosenCountry) {
      userData.country = sha256Country(chosenCountry);
    } else {
      delete userData.country;
    }

    // fbc validation/derivation (90 days)
    if (userData.fbc) {
      const parsed = parseFbc(userData.fbc);
      if (!parsed || isFbcExpired(parsed.ts)) {
        delete userData.fbc;
      }
    }
    if (!userData.fbc) {
      const fbclid = extractFbclid(eventData.event_source_url);
      if (fbclid) {
        const ts = Math.floor(Date.now() / 1000);
        userData.fbc = `fb.1.${ts}.${fbclid}`;
      }
    }

    // 5) Override IP/UA with server readings (if available)
    userData.client_ip_address = ipHeader || userData.client_ip_address || '';
    userData.client_user_agent =
      userAgentHeader || userData.client_user_agent || '';
    eventData.user_data = userData;

    // 6) Final payload for Meta
    const payload = {
      data: [eventData],
      test_event_code: eventData.test_event_code || 'TEST31560',
    };

    // 7) Env
    const pixelId = context.env.META_PIXEL_ID;
    const accessToken = context.env.META_ACCESS_TOKEN;
    if (!pixelId || !accessToken) {
      throw new Error(
        'Missing Meta Pixel credentials in environment variables',
      );
    }

    // 8) Logs (server-side only)
    console.info(
      '[Meta CAPI][Server] Outbound payload:',
      JSON.stringify(payload, null, 2),
    );

    // 9) Send to Meta
    const metaResponse = await fetch(
      `https://graph.facebook.com/v22.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
      },
    );

    const metaResult = await metaResponse.json();
    console.info(
      '[Meta CAPI][Server] Response:',
      JSON.stringify(metaResult, null, 2),
    );

    return json({success: true, result: metaResult});
  } catch (err) {
    console.error('[Meta CAPI][Server] Error:', err);
    return json({success: false, error: err.message}, {status: 500});
  }
}
