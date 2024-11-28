import React, { useState } from 'react';

export const ExpandableMenu = ({ menuItems }) => {
    const [expandedMenuId, setExpandedMenuId] = useState(null);

    const handleMenuToggle = (id) => {
        setExpandedMenuId((prev) => (prev === id ? null : id));
    };

    return (
        <div className="expandable-menu-container">
            {menuItems.map((item) => (
                <div key={item.id}>
                    <button onClick={() => handleMenuToggle(item.id)}>{item.title}</button>
                    {expandedMenuId === item.id && (
                        <div className="expandable-submenu">
                            {item.items.map((subItem) => (
                                <div key={subItem.id}>{subItem.title}</div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};
