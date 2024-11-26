// app/components/CategorySlider.jsx

import { Link } from '@remix-run/react';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState } from 'react';

export const CategorySlider = ({ menuItems }) => {
    const [expandedCategoryId, setExpandedCategoryId] = useState(null);

    const handleCategoryClick = (categoryId) => {
        setExpandedCategoryId((prev) => (prev === categoryId ? null : categoryId));
    };

    return (
        <div className="slide-con">
            <h3 className="cat-h3">Shop By Categories</h3>
            <div className="category-slider">
                {menuItems.map((item) => (
                    <CategoryItem
                        key={item.id}
                        item={item}
                        isExpanded={expandedCategoryId === item.id}
                        onClick={() => handleCategoryClick(item.id)}
                    />
                ))}
            </div>
        </div>
    );
};

function CategoryItem({ item, isExpanded, onClick }) {
    const hasSubitems = item.items && item.items.length > 0;
    const collection = item.collection;

    return (
        <div className="category-container">
            <div
                onClick={onClick}
                className="category-link"
                role="button"
                tabIndex={0}
                onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                        onClick();
                    }
                }}
                aria-expanded={isExpanded}
            >
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                    className="category-image-wrapper"
                >
                    {collection?.image ? (
                        <img
                            src={collection.image.url}
                            alt={collection.image.altText || collection.title}
                            className="category-image"
                        />
                    ) : (
                        <div className="category-placeholder-image">{item.title.charAt(0)}</div>
                    )}
                </motion.div>
                <div className="category-title">{item.title}</div>
            </div>
            <AnimatePresence>
                {isExpanded && hasSubitems && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="subcategory-list"
                    >
                        {item.items.map((subItem) => (
                            <Link
                                key={subItem.id}
                                to={subItem.url}
                                className="subcategory-item"
                            >
                                <div className="subcategory-title">{subItem.title}</div>
                            </Link>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
