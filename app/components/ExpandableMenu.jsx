import React, { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from '@remix-run/react';
import { Image } from '@shopify/hydrogen-react';
import "../styles/CollectionSlider.css"

export const ExpandableMenu = ({ menuItems }) => {
    if (!menuItems || menuItems.length === 0) {
        return null;
    }

    const [expandedCategories, setExpandedCategories] = useState([]);

    const handleCategoryClick = (id) => {
        setExpandedCategories((prevExpanded) => {
            const isCurrentlyExpanded = prevExpanded.includes(id);
            if (!isCurrentlyExpanded) {
                document.getElementById(id)?.classList.add('expanded');
            } else {
                document.getElementById(id)?.classList.remove('expanded');
            }
            return isCurrentlyExpanded
                ? prevExpanded.filter((categoryId) => categoryId !== id)
                : [...prevExpanded, id];
        });
    };

    return (
        <div className="slide-con">
            <h3 className="cat-h3">Shop By Categories</h3>
            <div className="category-slider">
                {menuItems.map((item, index) => (
                    <ExpandableMenuItem
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

const ExpandableMenuItem = ({ item, index, expandedCategories, onCategoryClick }) => {
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
                        <ExpandableMenuContent item={item} isInView={isInView} />
                    </div>
                ) : (
                    <Link to={item.url} className="category-link">
                        <ExpandableMenuContent item={item} isInView={isInView} />
                    </Link>
                )}
            </motion.div>
            {isExpanded && hasSubItems && (
                <div className="subcategory-list" id={item.id}>
                    {item.items.map((subItem, subIndex) => (
                        <ExpandableMenuItem
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
};

const ExpandableMenuContent = ({ item, isInView }) => {
    const title = item.title;

    return (
        <>
            <motion.div
                initial={{ filter: 'blur(10px)', opacity: 0 }}
                animate={isInView ? { filter: 'blur(0px)', opacity: 1 } : {}}
                transition={{ duration: 0.5 }}
                className="category-image-container"
            >
                {item.image ? (
                    <Image
                        data={item.image}
                        aspectRatio="1/1"
                        sizes="(min-width: 45em) 20vw, 40vw"
                        alt={item.image?.altText || title}
                        className="category-image"
                        width="150px"
                        height="150px"
                    />
                ) : (
                    <div className="category-placeholder-image"></div>
                )}
            </motion.div>
            <div className="category-title">{title}</div>
        </>
    );
};