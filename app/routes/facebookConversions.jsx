import { json } from '@shopify/remix-oxygen';
import { sha256 } from 'js-sha256';

// Helper to trim/lowercase before hashing
function sha256Hash(value) {
  if (!value) return '';
  const cleaned = value.trim().toLowerCase();
  return sha256(cleaned);
}

export async function action({ request }) {
  if (request.method !== 'POST') {
    return json({ error: 'Method Not Allowed' }, { status: 405 });
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
      request.socket?.remoteAddress ||
      '';
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
    userData.client_ip_address = ipHeader || userData.client_ip_address;
    userData.client_user_agent = userAgentHeader || userData.client_user_agent;

    eventData.user_data = userData;

    // 5. Final payload for Meta
    const payload = {
      data: [eventData],
      test_event_code: 'TEST31560',
    };

    console.log('[Server] x-forwarded-for:', request.headers.get('x-forwarded-for'));
    console.log('[Server] client-ip:', request.headers.get('client-ip'));
    console.log('[Server] cf-connecting-ip:', request.headers.get('cf-connecting-ip'));
    console.log('[Server] remoteAddress:', request.socket?.remoteAddress);
    console.log('[Server] Final payload to Meta CAPI:', JSON.stringify(payload, null, 2));

    // 6. Send to Meta
    const pixelId = '459846537541051';
    const accessToken =
      'EAACmPF8Xc9QBOxNkG4nVGty6DxVMsh7n4gu6IOxgNvsfhZBOSCFWCMGPrjiARtaljXFEMPowE1qLogpD8vJ8k3RoR9YlrtWfWEPG5YfgZB6plbvaauMuh5fjAuzuno1P50mzeSIKqHh4DlkGCpbxdN2ZAQN6m41OEewtR9sZAB14I2kHPEjUjFzaGh3QpnKSUAZDZD';

    // Update the Graph API version if needed:
    const metaResponse = await fetch(
      `https://graph.facebook.com/v22.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    const metaResult = await metaResponse.json();
    console.log('[Server] Meta response:', metaResult);

    // 7. Respond to client
    return json({ success: true, result: metaResult });
  } catch (err) {
    console.error('[Server] Error:', err);
    return json({ success: false, error: err.message }, { status: 500 });
  }
}
