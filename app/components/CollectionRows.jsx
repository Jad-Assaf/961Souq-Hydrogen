import React from 'react';
import { Link } from '@remix-run/react';
import { ProductRow } from './CollectionDisplay';

const CollectionRows = ({ collections, menuCollections }) => {
    return (
        <>
            {collections.map((collection, index) => {
                const isMenuRow = index % 3 === 0; // Every 3 rows, display a menu
                const menuIndex = Math.floor(index / 3); // Determine the menu index
                const currentMenu = menuCollections[menuIndex]; // Fetch the corresponding menu

                return (
                    <React.Fragment key={collection.id}>
                        {/* Render the menu slider row */}
                        {isMenuRow && currentMenu && (
                            <div className="menu-slider-row">
                                <h2 className="menu-title">Menu {menuIndex + 1}</h2>
                                <div className="category-slider">
                                    {currentMenu.map((menuCollection) => (
                                        <Link
                                            key={menuCollection.id}
                                            to={`/collections/${menuCollection.handle}`}
                                            className="menu-item"
                                        >
                                            {menuCollection.image && (
                                                <img
                                                    src={menuCollection.image.url}
                                                    alt={menuCollection.image.altText || menuCollection.title}
                                                    className="menu-image"
                                                />
                                            )}
                                            <div className="menu-collection-title">
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

export default CollectionRows;
