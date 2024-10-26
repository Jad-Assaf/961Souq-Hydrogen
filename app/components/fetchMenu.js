const GET_MENU_QUERY = `#graphql
  query GetMenu($handle: String!) {
    menu(handle: $handle) {
      items {
        id
        title
        url
        items {
          id
          title
          url
          items {
            id
            title
            url
          }
        }
      }
    }
  }
`;

export async function fetchMenuData(handle) {
    const response = await fetch('/api/shopify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            query: GET_MENU_QUERY,
            variables: { handle },
        }),
    });

    const { data } = await response.json();
    return data.menu;
}
