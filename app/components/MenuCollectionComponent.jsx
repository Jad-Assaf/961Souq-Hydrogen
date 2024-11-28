import { useFetcher } from '@remix-run/react';
import React, { useState, useEffect } from 'react';

/**
 * Fetch and display menu items and their related collection data.
 */
const MenuCollectionComponent = () => {
    const fetcher = useFetcher();
    const [menuItems, setMenuItems] = useState([]);
    const [collections, setCollections] = useState({});
    const [expandedMenuId, setExpandedMenuId] = useState(null);
    const [subMenuItems, setSubMenuItems] = useState([]);

    // Fetch the menu data initially
    useEffect(() => {
        fetchMenu();
    }, []);

    const fetchMenu = async () => {
        const menuHandle = 'new-main-menu';
        const menuQuery = `
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

        const result = await fetcher.load(`/api/graphql`, {
            method: 'POST',
            body: JSON.stringify({
                query: menuQuery,
                variables: { handle: menuHandle },
            }),
        });

        const menuData = result?.data?.menu?.items || [];
        setMenuItems(menuData);

        // Fetch collections for top-level menu items
        const topLevelHandles = extractHandlesFromMenu(menuData);
        await fetchCollections(topLevelHandles);
    };

    const extractHandlesFromMenu = (items) => {
        return items.map((item) => extractHandleFromUrl(item.url));
    };

    const fetchCollections = async (handles) => {
        const collectionQuery = `
      query GetCollectionByHandle($handle: String!) {
        collectionByHandle(handle: $handle) {
          id
          title
          handle
          image {
            url
            altText
          }
        }
      }
    `;

        const fetchedCollections = {};
        for (const handle of handles) {
            const result = await fetcher.load(`/api/graphql`, {
                method: 'POST',
                body: JSON.stringify({
                    query: collectionQuery,
                    variables: { handle },
                }),
            });
            const collection = result?.data?.collectionByHandle;
            if (collection) {
                fetchedCollections[handle] = collection;
            }
        }
        setCollections(fetchedCollections);
    };

    const extractHandleFromUrl = (url) => {
        const match = url?.match(/\/collections\/([a-zA-Z0-9\-_]+)/);
        return match?.[1] || null;
    };

    const handleExpandMenu = async (menuId, handle) => {
        if (expandedMenuId === menuId) {
            setExpandedMenuId(null);
            setSubMenuItems([]);
            return;
        }

        setExpandedMenuId(menuId);

        // Fetch sub-menu items if needed
        const subMenuQuery = `
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

        const result = await fetcher.load(`/api/graphql`, {
            method: 'POST',
            body: JSON.stringify({
                query: subMenuQuery,
                variables: { handle },
            }),
        });

        const subMenuData = result?.data?.menu?.items || [];
        setSubMenuItems(subMenuData);
    };

    return (
        <div>
            <h3>Menu with Collections</h3>
            <div className="menu-container">
                {menuItems.map((item) => {
                    const handle = extractHandleFromUrl(item.url);
                    const collection = collections[handle];

                    return (
                        <div key={item.id} className="menu-item">
                            <div onClick={() => handleExpandMenu(item.id, handle)} className="menu-item-header">
                                {collection?.image?.url ? (
                                    <img src={collection.image.url} alt={collection.image.altText} width="100" />
                                ) : (
                                    <div className="placeholder">No Image</div>
                                )}
                                <h4>{item.title}</h4>
                            </div>
                            {expandedMenuId === item.id && (
                                <div className="sub-menu">
                                    {subMenuItems.map((subItem) => (
                                        <div key={subItem.id} className="sub-menu-item">
                                            {subItem.title}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MenuCollectionComponent;
