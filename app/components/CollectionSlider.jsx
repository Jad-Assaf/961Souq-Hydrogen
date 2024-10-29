import { useEffect, useState } from 'react';
import { fetchCollectionsLoader } from './CollectionSlider'; // Import the loader function

export default function CollectionSlider({ context }) {
    const [collections, setCollections] = useState([]);

    useEffect(() => {
        async function fetchData() {
            const data = await fetchCollectionsLoader({ context });
            setCollections(data.collections);
        }
        fetchData();
    }, [context]);

    return (
        <div className="slide-con">
            <h3 className="cat-h3">Shop By Categories</h3>
            <div className="category-slider">
                {collections && collections.length > 0 ? (
                    collections.map((collection) => (
                        <Link
                            key={collection.id}
                            to={`/collections/${collection.handle}`}
                            className="category-container"
                        >
                            <img
                                data={collection.image}
                                srcSet={collection.image?.url}
                                alt={collection.image?.altText || collection.title}
                                className="category-image"
                                loading="lazy"
                                width="175"
                                height="175"
                            />
                            <div className="category-title">{collection.title}</div>
                        </Link>
                    ))
                ) : (
                    <div>No collections found.</div>
                )}
            </div>
        </div>
    );
}
