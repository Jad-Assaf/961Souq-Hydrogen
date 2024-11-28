// CollectionSlider.jsx (CategorySlider.jsx)
import { Link } from '@remix-run/react';
import { Image } from '@shopify/hydrogen-react';
import { motion, useInView } from 'framer-motion';
import React, { useRef, useState } from 'react';

export const CategorySlider = ({ menu, sliderCollections, subCollections }) => {
    if (!menu || !menu.items) {
        return null; // or some fallback UI
    }

    const [expandedCategories, setExpandedCategories] = useState([]);

    // Create a mapping from collection handle to collection object
    const collectionMap = {};
    // Merge sliderCollections and subCollections into collectionMap
    [...sliderCollections, ...subCollections].forEach((collection) => {
        collectionMap[collection.handle] = collection;
    });

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
                        collectionMap={collectionMap} // Pass the updated collectionMap
                    />
                ))}
            </div>
        </div>
    );
};

function CategoryItem({ item, index, expandedCategories, onCategoryClick, collectionMap }) {
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
                        <CategoryContent item={item} isInView={isInView} collectionMap={collectionMap} />
                    </div>
                ) : (
                    <Link to={item.url} className="category-link">
                        <CategoryContent item={item} isInView={isInView} collectionMap={collectionMap} />
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
                            collectionMap={collectionMap}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function CategoryContent({ item, isInView, collectionMap }) {
    const title = item.title;

    // Extract the handle from the item's URL
    const handle = extractHandleFromUrl(item.url);
    const collection = handle ? collectionMap[handle] : null;

    return (
        <>
            <motion.div
                initial={{ filter: 'blur(10px)', opacity: 0 }}
                animate={isInView ? { filter: 'blur(0px)', opacity: 1 } : {}}
                transition={{ duration: 0.5 }}
                className="category-image-container"
            >
                {collection && collection.image ? (
                    <Image
                        data={collection.image}
                        aspectRatio="1/1"
                        sizes="(min-width: 45em) 20vw, 40vw"
                        alt={collection.image?.altText || title}
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
}

// Helper function to extract handle from URL
function extractHandleFromUrl(url) {
  const match = url?.match(/\/collections\/([a-zA-Z0-9\-_]+)/);
  return match?.[1] || null;
}
