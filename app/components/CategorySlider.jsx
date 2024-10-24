// ~/components/CategorySlider.js
import React, { useEffect, useState } from 'react';
import '../assets/CategorySlider.css'; // Ensure you have this CSS file

const CategorySlider = ({ menu }) => {
    const [collections, setCollections] = useState({});

    // Fetch collection details (like images) for linked collections
    useEffect(() => {
        const fetchCollectionImages = async () => {
            const collectionData = {};

            // Iterate over menu items and fetch collection details if applicable
            for (const item of menu) {
                if (item.type === 'HTTP' && item.url.startsWith('/collections/')) {
                    const handle = item.url.split('/collections/')[1]; // Extract handle from URL
                    const collection = await fetchCollectionByHandle(handle);
                    if (collection) {
                        collectionData[handle] = collection.image?.src || null;
                    }
                }
            }

            setCollections(collectionData);
        };

        fetchCollectionImages();
    }, [menu]);

    // Helper function to fetch collection data by handle
    const fetchCollectionByHandle = async (handle) => {
        try {
            const response = await fetch(`/api/collection?handle=${handle}`);
            const data = await response.json();
            return data.collection;
        } catch (error) {
            console.error(`Failed to fetch collection with handle "${handle}":`, error);
            return null;
        }
    };

    return (
        <div className="slide-con">
            <h3 className="cat-h3">Shop By Categories</h3>
            <div className="mob-con">
                <div className="category-slider">
                    {menu.map((item) => (
                        item.type === 'HTTP' && item.url.startsWith('/collections/') && (
                            <a
                                key={item.id}
                                href={item.url}
                                className="category-container lazyload animate--slide-in"
                            >
                                <img
                                    className="category-image"
                                    src={
                                        collections[item.url.split('/collections/')[1]] ||
                                        'https://via.placeholder.com/150'
                                    }
                                    alt={`A Photo Depicting ${item.title}`}
                                    width="175"
                                    height="175"
                                    loading="lazy"
                                />
                                <div className="category-title">{item.title}</div>
                            </a>
                        )
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CategorySlider;
