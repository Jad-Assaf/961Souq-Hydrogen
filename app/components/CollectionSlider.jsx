import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/CollectionSlider.css';

const SLIDER_COLLECTION_QUERY = `#graphql
  query GetSliderCollection($handle: String!) {
    collectionByHandle(handle: $handle) {
      id
      title
      handle
      image {
        url
        altText
      }
    }
  }
`;

async function fetchSliderCollections(context) {
    const handles = ['apple', 'gaming', 'laptops', 'monitors']; // Slider-specific handles
    const collections = [];
    for (const handle of handles) {
        const { collectionByHandle } = await context.storefront.query(
            SLIDER_COLLECTION_QUERY,
            { variables: { handle } }
        );
        if (collectionByHandle) collections.push(collectionByHandle);
    }
    return collections;
}

export default function CollectionSlider({ context }) {
    const [collections, setCollections] = useState([]);

    useEffect(() => {
        if (!context) {
            console.error("Context is not available.");
            return;
        }

        // Fetch the data when the component mounts
        fetchSliderCollections(context).then((data) => {
            setCollections(data);
        }).catch((error) => {
            console.error("Failed to fetch collections:", error);
        });
    }, [context]);

    return (
        <div className="slide-con">
            <h3 className="cat-h3">Shop By Categories</h3>
            <div className="category-slider">
                {collections.map((collection) => (
                    <Link
                        key={collection.id}
                        to={`/collections/${collection.handle}`}
                        className="category-container"
                    >
                        <img
                            src={collection.image?.url || 'fallback-image.jpg'}
                            alt={collection.image?.altText || collection.title}
                            className="category-image"
                            loading="lazy"
                            width="175"
                            height="175"
                        />
                        <div className="category-title">{collection.title}</div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
