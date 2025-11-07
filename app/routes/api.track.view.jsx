// app/routes/api.track.view.jsx
import {json} from '@shopify/remix-oxygen';
import {viewedHandlesCookie} from '~/lib/viewedHandlesCookie.server';

const MAX_HANDLES = 60;

export async function action({request}) {
  let payload = {};
  if (request.headers.get('content-type')?.includes('application/json')) {
    payload = await request.json().catch(() => ({}));
  } else {
    const fd = await request.formData().catch(() => null);
    if (fd) payload = Object.fromEntries(fd.entries());
  }

  const handle = (payload.handle || '').trim();
  if (!handle) {
    return json({ok: false, error: 'Missing handle'}, {status: 400});
  }

  const cookieRaw = request.headers.get('Cookie');
  const current = (await viewedHandlesCookie.parse(cookieRaw)) || [];

  // Make it unique & LRU with the newest at the front.
  const next = [handle, ...current.filter((h) => h !== handle)].slice(
    0,
    MAX_HANDLES,
  );

  return json(
    {ok: true, handles: next},
    {headers: {'Set-Cookie': await viewedHandlesCookie.serialize(next)}},
  );
}
