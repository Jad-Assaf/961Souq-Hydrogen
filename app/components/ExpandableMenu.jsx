import React, { useState } from 'react';
import { Image } from '@shopify/hydrogen-react';

export const ExpandableMenu = ({ menuItems }) => {
    const [expandedMenuId, setExpandedMenuId] = useState(null);

    const handleMenuToggle = (id) => {
        setExpandedMenuId((prev) => (prev === id ? null : id));
    };

    return (
        <div className="expandable-menu-container">
            {menuItems.map((item) => {
                const collectionImageUrl = item.image?.url; // Use the enriched image data
                const collectionAltText = item.image?.altText || item.title;

                return (
                    <div key={item.id} className="menu-item">
                        <button onClick={() => handleMenuToggle(item.id)}>
                            {item.title}
                            {collectionImageUrl && (
                                <Image
                                    src={collectionImageUrl}
                                    alt={collectionAltText}
                                    className="menu-item-image"
                                    aspectRatio="1/1"
                                />
                            )}
                        </button>
                        {expandedMenuId === item.id && item.items && (
                            <div className="submenu">
                                {item.items.map((subItem) => (
                                    <div key={subItem.id} className="submenu-item">
                                        {subItem.title}
                                        {subItem.image?.url && (
                                            <Image
                                                src={subItem.image.url}
                                                alt={subItem.image.altText || subItem.title}
                                                className="submenu-item-image"
                                                aspectRatio="1/1"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
