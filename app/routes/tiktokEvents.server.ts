import {sha256} from 'js-sha256';          // pure-JS SHA-256 :contentReference[oaicite:2]{index=2}

const ENDPOINT =
  'https://business-api.tiktok.com/open_api/v1.3/event/track/'; // v1.3 :contentReference[oaicite:3]{index=3}
const PIXEL_ID = process.env.TIKTOK_PIXEL_ID!;
const TOKEN    = process.env.TIKTOK_ACCESS_TOKEN!;              // Events-API token

const hash = (v?: string) => (v ? sha256(v.trim().toLowerCase()) : undefined);

/**
 * Relay one event to TikTok Events API (server side).
 */
export async function sendTikTokEvent({
  event,
  event_id,
  value,
  currency,
  content_id,
  search_string,
  user,
}: {
  event: string;
  event_id: string;
  value?: number;
  currency?: string;
  content_id?: string;
  search_string?: string;
  user: {ip: string; ua: string; url: string; email?: string; phone?: string};
}) {
  const payload = {
    pixel_code: PIXEL_ID,
    batch: [
      {
        event,
        event_id,
        timestamp: Math.floor(Date.now() / 1000), // Unix-sec; TikTok <5 min window :contentReference[oaicite:4]{index=4}
        context: {
          ip: user.ip,
          user_agent: user.ua,
          page: {url: user.url},
        },
        user: {
          email: hash(user.email),
          phone_number: hash(user.phone),
        },
        properties: {
          content_id,
          content_type: content_id ? 'product' : undefined,
          search_string,
          value,
          currency,
        },
      },
    ],
  };

  await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Access-Token': TOKEN,
    },
    body: JSON.stringify(payload),
  });
}
