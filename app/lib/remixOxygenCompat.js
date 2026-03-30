import {
  createCookieSessionStorage,
  data,
  redirect,
} from 'react-router';

export {createCookieSessionStorage, data, redirect};

export function json(value, init) {
  return data(value, init);
}

export function defer(value, init) {
  return init ? data(value, init) : value;
}
