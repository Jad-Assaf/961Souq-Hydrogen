import {redirect} from '@shopify/remix-oxygen';

export async function loader() {
  return redirect('https://shopify.com/55208837292/account');
}

/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
