import { useLoaderData } from '@remix-run/react';
import { defer } from '@shopify/remix-oxygen';
import { Link } from 'react-router-dom';
import '../styles/CollectionSlider.css'

export async function loader({ context }) {
    const handles = [
        'apple', 'gaming', 'gaming-laptops',
        'laptops', 'mobiles', 'apple-iphone', 'samsung',
        'monitors', 'fitness watches'
    ];

    const collections = await fetchCollectionsByHandles(context, handles);
    return defer({ collections });
}

async function fetchCollectionsByHandles(context, handles) {
    const collections = [];
    for (const handle of handles) {
        const { collectionByHandle } = await context.storefront.query(
            GET_COLLECTION_BY_HANDLE_QUERY,
            { variables: { handle } }
        );
        if (collectionByHandle) {
            console.log(collectionByHandle.image?.url);  // Log the correct URL.
            collections.push(collectionByHandle);
        }
    }
    return collections;
}.0

const GET_COLLECTION_BY_HANDLE_QUERY = `#graphql
  query GetCollectionByHandle($handle: String!) {
  collectionByHandle(handle: $handle) {
    id
    title
    handle
    image {
      url
      altText
      id
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
                {collections && collections.length > 0 ? (
                    collections.map((collection) => {
                        return (
                            <Link
                                key={collection.id}
                                to={`/collections/${collection.handle}`}
                                className="category-container"
                            >
                                <img
                                    srcSet={`${collection.image.url}?width=300&quality=30 300w,
             ${collection.image.url}?width=600&quality=30 600w,
             ${collection.image.url}?width=1200&quality=30 1200w`}
                                    alt={collection.image.altText || collection.title}
                                    width="175"
                                    height="175"
                                    loading="lazy"
                                    className="category-image"
                                />
                                <div className="category-title">{collection.title}</div>
                            </Link>
                        );
                    })
                ) : (
                    <div>No collections found.</div>
                )}
            </div>
        </div>
    );
}