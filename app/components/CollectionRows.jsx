import React from 'react';
import { Link } from '@remix-run/react';
import { ProductRow } from './CollectionDisplay';

const CollectionRows = ({ collections, menuCollections }) => {
    // Filter out collections with the handles "new-arrivals" and "laptops"
    const filteredCollections = collections.filter(
        (collection) => collection.handle !== "new-arrivals" && collection.handle !== "laptops"
    );

    return (
        <>
            {filteredCollections.map((collection, index) => {
                const isMenuRow = index % 3 === 0; // Every 3 rows, display a menu
                const menuIndex = Math.floor(index / 3); // Determine the menu index
                const currentMenu = menuCollections[menuIndex]; // Fetch the corresponding menu

                return (
                    <React.Fragment key={collection.id}>
                        {/* Render the menu slider row */}
                        {isMenuRow && currentMenu && (
                            <div className="menu-slider-container">
                                <div className="menu-category-slider">
                                    
                                    {currentMenu.map((menuCollection) => (
                                        <Link
                                            key={menuCollection.id}
                                            to={`/collections/${menuCollection.handle}`}
                                            className="menu-item-container"
                                        >
                                            {menuCollection.image && (
                                                <img
                                                    src={menuCollection.image.url}
                                                    alt={menuCollection.image.altText || menuCollection.title}
                                                    className="menu-item-image"
                                                    width={150}
                                                    height={150}
                                                />
                                            )}
                                            <div className="category-title">
                                                {menuCollection.title}
                                            </div>
                                        </Link>
                                    ))}
                                    
                                </div>
                            </div>
                        )}

                        {/* Render the product row */}
                        <div className="collection-section">
                            <div className="collection-header">
                                <h3>{collection.title}</h3>
                                <Link to={`/collections/${collection.handle}`} className="view-all-link">
                                    View All
                                </Link>
                            </div>
                            <ProductRow products={collection.products.nodes} />
                        </div>
                    </React.Fragment>
                );
            })}
        </>
    );
};

const LeftArrowIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
);

const RightArrowIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
);

export default CollectionRows;
