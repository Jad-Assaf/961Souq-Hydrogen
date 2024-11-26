// CollectionSlider.jsx (CategorySlider.jsx)
import { Link } from '@remix-run/react';
import { motion, useInView } from 'framer-motion';
import React, { useRef, useState } from 'react';

export const CategorySlider = ({ menu }) => {
    if (!menu || !menu.items) {
        return null; // or some fallback UI
    }
    const [expandedCategories, setExpandedCategories] = useState([]);

    const handleCategoryClick = (id) => {
        setExpandedCategories((prevExpanded) =>
            prevExpanded.includes(id)
                ? prevExpanded.filter((categoryId) => categoryId !== id)
                : [...prevExpanded, id]
        );
    };

    return (
        <div className="slide-con">
            <h3 className="cat-h3">Shop By Categories</h3>
            <div className="category-slider">
                {menu.items.map((item, index) => (
                    <CategoryItem
                        key={item.id}
                        item={item}
                        index={index}
                        expandedCategories={expandedCategories}
                        onCategoryClick={handleCategoryClick}
                    />
                ))}
            </div>
        </div>
    );
};

function CategoryItem({ item, index, expandedCategories, onCategoryClick }) {
    const isExpanded = expandedCategories.includes(item.id);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });
    const hasSubItems = item.items && item.items.length > 0;

    const handleClick = (e) => {
        if (hasSubItems) {
            e.preventDefault();
            onCategoryClick(item.id);
        }
    };

    return (
        <div className={`category-item ${isExpanded ? 'expanded' : ''}`}>
            <motion.div
                ref={ref}
                initial={{ opacity: 0, x: -30 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: index * 0.01, duration: 0.5 }}
                className="category-container"
            >
                {hasSubItems ? (
                    <div onClick={handleClick} className="category-link">
                        <CategoryContent title={item.title} isInView={isInView} />
                    </div>
                ) : (
                    <Link to={item.url} className="category-link">
                        <CategoryContent title={item.title} isInView={isInView} />
                    </Link>
                )}
            </motion.div>
            {isExpanded && hasSubItems && (
                <div className="subcategory-list">
                    {item.items.map((subItem, subIndex) => (
                        <CategoryItem
                            key={subItem.id}
                            item={subItem}
                            index={subIndex}
                            expandedCategories={expandedCategories}
                            onCategoryClick={onCategoryClick}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function CategoryContent({ title, isInView }) {
    return (
        <>
            <motion.div
                initial={{ filter: 'blur(10px)', opacity: 0 }}
                animate={isInView ? { filter: 'blur(0px)', opacity: 1 } : {}}
                transition={{ duration: 0.5 }}
                width="150px"
                height="150px"
            >
                {/* Placeholder for image or icon */}
                <div className="category-placeholder-image"></div>
            </motion.div>
            <div className="category-title">{title}</div>
        </>
    );
}
