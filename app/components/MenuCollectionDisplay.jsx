import React from "react";
import '../styles/MenuCollectionDisplay.css'

// components/MenuCollectionDisplay.jsx
export function MenuCollectionDisplay({ menu }) {
    return (
        <div className="slide-con">
            <h3 className="cat-h3">Featured Collections</h3>
            <div className="category-slider">
                {menu.items.map((item) => (
                    <div key={item.id} className="category-container">
                        <img
                            src={item.image ? item.image.url : 'https://via.placeholder.com/150'}
                            alt={item.title}
                            className="category-image"
                        />
                        <span className="category-title">{item.title}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
