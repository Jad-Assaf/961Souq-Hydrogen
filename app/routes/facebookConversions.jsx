import {json} from '@shopify/remix-oxygen';
import {sha256} from 'js-sha256';

// Helper to trim/lowercase before hashing
function sha256Hash(value) {
  if (!value) return '';
  const cleaned = value.trim().toLowerCase();
  return sha256(cleaned);
}

function firstIp(value) {
  if (!value) return '';
  return value.split(',')[0].trim();
}

function getClientIpFromHeaders(request) {
  const cf =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('true-client-ip') ||
    '';
  const xReal = request.headers.get('x-real-ip') || '';
  const xff = request.headers.get('x-forwarded-for') || '';
  const clientIp = request.headers.get('client-ip') || '';

  const raw = cf || xReal || xff || clientIp;
  return firstIp(raw);
}

export async function action({request, context}) {
  if (request.method !== 'POST') {
    return json({error: 'Method Not Allowed'}, {status: 405});
  }

  try {
    // 1. Get event data from the client
    const eventData = await request.json();

    // 2. Get real IP/User-Agent from request headers
    const ipHeader = getClientIpFromHeaders(request);
    const userAgentHeader = request.headers.get('user-agent') || '';

    // 3. Hash email/phone if present
    const userData = eventData.user_data || {};

    if (userData.email) {
      userData.em = sha256Hash(userData.email);
      delete userData.email;
    }
    if (userData.phone) {
      userData.ph = sha256Hash(userData.phone);
      delete userData.phone;
    }

    // 4. Override IP/UA with server readings (if available)
    if (ipHeader) {
      userData.client_ip_address = ipHeader;
    }
    if (userAgentHeader) {
      userData.client_user_agent = userAgentHeader;
    }

    eventData.user_data = userData;

    // 5. Final payload for Meta
    const payload = {
      data: [eventData],
      test_event_code: 'TEST31560',
    };

    // 6. Read Pixel ID and Access Token from Oxygen env
    const pixelId = context.env.META_PIXEL_ID;
    const accessToken = context.env.META_ACCESS_TOKEN;

    if (!pixelId || !accessToken) {
      throw new Error(
        'Missing Meta Pixel credentials in environment variables',
      );
    }

    // 7. Send to Meta Conversions API
    const metaResponse = await fetch(
      `https://graph.facebook.com/v22.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
      },
    );

    const metaResult = await metaResponse.json();

    // 8. Respond to client
    return json({success: true, result: metaResult});
  } catch (err) {
    console.error('[Server] Error:', err);
    return json({success: false, error: err.message}, {status: 500});
  }
}
