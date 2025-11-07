// app/utils/viewedHandlesCookie.server.js
import {createCookie} from '@shopify/remix-oxygen';

/**
 * Stores an array of product handles (strings).
 * Keep it small to fit cookie size limits. We’ll cap at ~60.
 */
export const viewedHandlesCookie = createCookie('rv', {
  httpOnly: true,
  secure: true,
  path: '/',
  sameSite: 'Lax',
  maxAge: 60 * 60 * 24 * 365, // 1 year
  // Add a secret so the cookie is signed (change in env for prod).
  secrets: [process.env.SESSION_SECRET || 'dev-secret'],
});
