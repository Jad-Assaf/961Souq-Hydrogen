import React from 'react';
import { Link } from '@remix-run/react';

export function CategorySlider({ sliderCollections }) {
    return (
        <div className="category-slider">
            {sliderCollections.map((collection) => (
                <div key={collection.id} className="category-item">
                    {/* Main Collection */}
                    <Link to={`/collections/${collection.handle}`} className="category-link">
                        {collection.image ? (
                            <img
                                src={collection.image.url}
                                alt={collection.image.altText || collection.title}
                                className="category-image"
                            />
                        ) : (
                            <div className="category-placeholder-image">No Image</div>
                        )}
                        <h2 className="category-title">{collection.title}</h2>
                    </Link>

                    {/* Subcollections */}
                    {collection.items && collection.items.length > 0 && (
                        <div className="subcategory-list">
                            {collection.items.map((subcollection) => (
                                <div key={subcollection.id} className="subcategory-item">
                                    <Link to={`/collections/${subcollection.handle}`} className="subcategory-link">
                                        {subcollection.image ? (
                                            <img
                                                src={subcollection.image.url}
                                                alt={subcollection.image.altText || subcollection.title}
                                                className="subcategory-image"
                                            />
                                        ) : (
                                            <div className="subcategory-placeholder-image">No Image</div>
                                        )}
                                        <h3 className="subcategory-title">{subcollection.title}</h3>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
