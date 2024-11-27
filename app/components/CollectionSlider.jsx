// CollectionSlider.jsx (CategorySlider.jsx)
import { Link } from '@remix-run/react';
import { Image } from '@shopify/hydrogen-react';
import { motion, useInView } from 'framer-motion';
import React, { useRef, useState } from 'react';

export const CategorySlider = ({ menu, sliderCollections }) => {
    if (!menu || !menu.items) {
        return null; // or some fallback UI
    }

    const [expandedCategories, setExpandedCategories] = useState([]);

    // Create a mapping from collection handle to collection object
    const collectionMap = {};
    sliderCollections.forEach((collection) => {
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
                        collectionMap={collectionMap}
                    />
                ))}
            </div>
        </div>
    );
};

function CategoryItem({ item, index, expandedCategories, onCategoryClick, collectionMap }) {
    const isExpanded = expandedCategories.includes(item.title);
    const hasSubItems = item.items && item.items.length > 0;

    const handleCategoryClick = () => {
        onCategoryClick(item.title);
    };

    return (
        <div key={item.id} className="category-item">
            <div onClick={handleCategoryClick} className="category-title">
                {item.title}
            </div>

            {/* Render image for main category */}
            {collectionMap[item.title] && collectionMap[item.title].image ? (
                <Image
                    data={collectionMap[item.title].image}
                    aspectRatio="1/1"
                    sizes="(min-width: 45em) 20vw, 40vw"
                    alt={collectionMap[item.title].image?.altText || item.title}
                    className="category-image"
                    width="150px"
                    height="150px"
                />
            ) : (
                <div className="category-placeholder-image"></div>
            )}

            {/* Render sub-items if expanded */}
            {isExpanded && hasSubItems && (
                <div className="subcategory-list">
                    {item.items.map((subItem) => (
                        <div key={subItem.id} className="subcategory-item">
                            <div className="subcategory-title">{subItem.title}</div>

                            {/* Render image for sub-item */}
                            {collectionMap[subItem.title] && collectionMap[subItem.title].image ? (
                                <Image
                                    data={collectionMap[subItem.title].image}
                                    aspectRatio="1/1"
                                    sizes="(min-width: 45em) 20vw, 40vw"
                                    alt={collectionMap[subItem.title].image?.altText || subItem.title}
                                    className="subcategory-image"
                                    width="100px" // Adjust size as needed
                                    height="100px" // Adjust size as needed
                                />
                            ) : (
                                <div className="subcategory-placeholder-image"></div>
                            )}
                        </div>
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
    const match = url.match(/\/collections\/([a-zA-Z0-9\-_]+)/);
    if (match && match[1]) {
        return match[1];
    }
    return null;
}
