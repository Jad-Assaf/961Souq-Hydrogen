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
                const collectionImageUrl = item.image?.url; // Assuming `item.image` is part of the fetched collection data
                const collectionAltText = item.image?.altText || item.title;

                return (
                    <div key={item.id} className="menu-item">
                        <button onClick={() => handleMenuToggle(item.id)}>{item.title}</button>
                        {collectionImageUrl && (
                            <div className="menu-item-image">
                                <Image
                                    src={collectionImageUrl}
                                    alt={collectionAltText}
                                    aspectRatio="1/1"
                                    sizes="(min-width: 45em) 20vw, 40vw"
                                    className="menu-image"
                                />
                            </div>
                        )}
                        {expandedMenuId === item.id && (
                            <div className="expandable-submenu">
                                {item.items.map((subItem) => (
                                    <div key={subItem.id} className="submenu-item">
                                        <span>{subItem.title}</span>
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
