import React from 'react';
import './CategorySlider.css'; // Import the CSS file for styling

/**
 * CategorySlider Component.
 * Renders categories from a Shopify menu.
 */
export function CategorySlider({ menu }) {
    return (
        <div className="slide-con">
            <h3 className="cat-h3">Shop By Categories</h3>
            <div className="mob-con">
                <div className="category-slider">
                    {menu.items.map((item, index) => (
                        <a key={index} href={item.url} className="category-container">
                            <img
                                className="category-image"
                                src={item.imageSrc || 'https://via.placeholder.com/150'}
                                alt={`Category: ${item.title}`}
                                width="175"
                                height="175"
                                loading="lazy"
                            />
                            <div className="category-title">{item.title}</div>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
}
