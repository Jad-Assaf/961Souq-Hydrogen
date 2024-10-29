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
    images(first: 5) {
      nodes {
        url
        altText
        id
      }
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
                        const imageUrl = collection.image?.nodes[0].url
                            ? `${collection.image.nodes[0].url}?width=300&height=300`
                            : 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/fallback-image.jpg';

                        return (
                            <Link
                                key={collection.id}
                                to={`/collections/${collection.handle}`}
                                className="category-container"
                            >
                                <img
                                    srcSet={`
                                        ${imageUrl}?width=300&height=300 300w,
                                        ${imageUrl}?width=600&height=600 600w,
                                        ${imageUrl}?width=1200&height=1200 1200w
                                    `}
                                    sizes="(min-width: 45em) 20vw, 40vw"
                                    alt={collection.image?.altText || collection.title}
                                    className="category-image"
                                    loading="lazy"
                                    width="175"
                                    height="175"
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
