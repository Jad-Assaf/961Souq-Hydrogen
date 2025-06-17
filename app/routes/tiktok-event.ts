import { sendTikTokEvent } from '../lib/tiktokEvents.server';

export async function action({request}) {
  const data = await request.json();         // {event, event_id, url, …}

  const ip =
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for') ??
    '';
  const ua = request.headers.get('user-agent') ?? '';

  await sendTikTokEvent({
    ...data,
    user: {ip, ua, url: data.url},
  });

  console.log(
    `[TikTok] Events API ➜ ${data.event} • id=${data.event_id}`,
  );

  return ({ok: true});
}
