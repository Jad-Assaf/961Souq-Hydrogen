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

// Take first IP if list
function firstIp(ipHeader) {
  if (!ipHeader) return '';
  return String(ipHeader).split(',')[0].trim();
}

export async function action({request, context}) {
  if (request.method !== 'POST') {
    return json({error: 'Method Not Allowed'}, {status: 405});
  }

  try {
    const eventData = await request.json();

    const ipHeader =
      firstIp(request.headers.get('x-forwarded-for')) ||
      request.headers.get('client-ip') ||
      request.headers.get('cf-connecting-ip') ||
      '';
    const userAgentHeader = request.headers.get('user-agent') || '';
    const refererHeader = request.headers.get('referer') || '';

    const userData = eventData.user_data || {};

    if (userData.email) {
      userData.em = sha256Hash(userData.email);
      delete userData.email;
    }
    if (userData.phone) {
      userData.ph = sha256Phone(userData.phone);
      delete userData.phone;
    }

    // ✅ Ensure 2-letter lowercase country code if provided
    if (userData.country) {
      const m = String(userData.country).match(/^[A-Za-z]{2}/);
      userData.country = m ? m[0].toLowerCase() : '';
    }

    userData.client_ip_address = ipHeader || userData.client_ip_address || '';
    userData.client_user_agent =
      userAgentHeader || userData.client_user_agent || '';
    eventData.user_data = userData;

    if (!eventData.event_source_url) {
      eventData.event_source_url =
        (eventData.custom_data && eventData.custom_data.URL) ||
        refererHeader ||
        '';
    }

    const payload = {
      data: [eventData],
      test_event_code: eventData.test_event_code || 'TEST31560',
    };

    const pixelId = context.env.META_PIXEL_ID;
    const accessToken = context.env.META_ACCESS_TOKEN;
    if (!pixelId || !accessToken) {
      throw new Error(
        'Missing Meta Pixel credentials in environment variables',
      );
    }

    console.info(
      '[Meta CAPI][Server] Outbound payload:',
      JSON.stringify(payload, null, 2),
    );

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
