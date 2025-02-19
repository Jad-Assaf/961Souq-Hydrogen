import {json} from '@shopify/remix-oxygen';
import {sha256} from 'js-sha256';

// Minimal helper to lowercase/trim before hashing
function sha256Hash(value) {
  if (!value) return '';
  const cleaned = value.trim().toLowerCase();
  return sha256(cleaned);
}

export async function action({request}) {
  if (request.method !== 'POST') {
    return json({error: 'Method Not Allowed'}, {status: 405});
  }

  try {
    // 1. Get event data from the client
    const eventData = await request.json();
    console.log('[Server] Received from client:', eventData);

    // 2. Attempt to get real IP/User-Agent from request headers
    const ipHeader =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('client-ip') ||
      request.headers.get('cf-connecting-ip') ||
      '';
    const userAgentHeader = request.headers.get('user-agent') || '';

    // 3. Hash email/phone if present
    const userData = eventData.user_data || {};
    if (userData.email) {
      userData.em = sha256Hash(userData.email);
      delete userData.email; // remove plain text
    }
    if (userData.phone) {
      userData.ph = sha256Hash(userData.phone);
      delete userData.phone; // remove plain text
    }

    // 4. Override IP/UA with server readings (recommended for best matching)
    userData.client_ip_address = ipHeader || userData.client_ip_address;
    userData.client_user_agent = userAgentHeader || userData.client_user_agent;

    eventData.user_data = userData;

    // 5. Final payload for Meta
    const payload = {
      data: [eventData],
      // You can remove or replace this test code in production
      test_event_code: 'TEST31560',
    };

    console.log('[Server] Final payload to Meta CAPI:', payload);

    // 6. Send to Meta
    const pixelId = '459846537541051';
    const accessToken =
      'EAACmPF8Xc9QBOxNkG4nVGty6DxVMsh7n4gu6IOxgNvsfhZBOSCFWCMGPrjiARtaljXFEMPowE1qLogpD8vJ8k3RoR9YlrtWfWEPG5YfgZB6plbvaauMuh5fjAuzuno1P50mzeSIKqHh4DlkGCpbxdN2ZAQN6m41OEewtR9sZAB14I2kHPEjUjFzaGh3QpnKSUAZDZD';

    const metaResponse = await fetch(
      `https://graph.facebook.com/v12.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
      },
    );

    const metaResult = await metaResponse.json();
    console.log('[Server] Meta response:', metaResult);

    // 7. Respond to client
    return json({success: true, result: metaResult});
  } catch (err) {
    console.error('[Server] Error:', err);
    return json({success: false, error: err.message}, {status: 500});
  }
}
