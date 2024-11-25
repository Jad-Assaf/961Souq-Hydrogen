import { json } from '@shopify/remix-oxygen';

export async function loader(args) {
  console.log("Loader function called"); // Log when the loader is called
  const deferredData = loadDeferredData(args);
  console.log("Deferred data loaded"); // Log after loading deferred data
  const criticalData = await loadCriticalData(args);
  console.log("Critical data loaded"); // Log after loading critical data

  return defer({ ...deferredData, ...criticalData });
}

async function loadCriticalData({ context, params, request }) {
  console.log("loadCriticalData called"); // Log when this function is called
  const { handle } = params;
  const { storefront } = context;

  if (!handle) {
    throw new Error('Expected product handle to be defined');
  }

  // ... rest of the code
}