// app/routes/api/submenu.js
import {json} from '@remix-run/node';

const SUBMENU_QUERY = `
  query Submenu($parentId: ID!) {
    menu(id: $parentId) {
      items {
        id
        title
        url
        resource {
          image {
            src
            altText
          }
        }
      }
    }
  }
`;

export async function loader({request, context}) {
  const url = new URL(request.url);
  const parentId = url.searchParams.get('parentId');
  if (!parentId) {
    return json({error: 'parentId required'}, {status: 400});
  }
  const {storefront} = context;
  try {
    const data = await storefront.query(SUBMENU_QUERY, {
      variables: {parentId},
    });
    return json({items: data.menu.items || []});
  } catch (error) {
    return json({error: error.message}, {status: 500});
  }
}
