import { useLoaderData } from '@remix-run/react';
import { defer } from '@shopify/remix-oxygen';
import { Link } from 'react-router-dom';
import '../styles/CollectionSlider.css';

// Self-contained loader for CollectionSlider
export async function collectionSliderLoader({ context }) {
    const sliderHandles = ['apple', 'gaming', 'laptops', 'monitors']; // Slider-specific handles
    const collections = await fetchCollectionsForSlider(context, sliderHandles);
    return defer({ collections });
}

// Fetch only slider collections
async function fetchCollectionsForSlider(context, handles) {
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

// Query for CollectionSlider-specific collections
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

export default function CollectionSlider() {
    const { collections } = useLoaderData();

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
