import { useLoaderData } from '@remix-run/react';
import { defer } from '@shopify/remix-oxygen';
import { Link } from 'react-router-dom';
import '../styles/CollectionSlider.css'

export async function loader({ context }) {
    const handles = [
        'new-arrivals', 'apple', 'gaming', 'gaming-laptops',
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
        if (collectionByHandle) collections.push(collectionByHandle);
    }
    return collections;
}

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
            <h3 className="cat-h3">Featured Categories</h3>
            <div className="category-slider">
                {collections.map((collection) => (
                    <Link
                        key={collection.id}
                        to={`/collections/${collection.handle}`}
                        className="category-container"
                    >
                        {collection.image ? (
                            <img
                                src={collection.image.nodes[0].url}
                                alt={collection.image.altText || collection.title}
                                className="category-image"
                            />
                        ) : (
                            <div className="category-image-placeholder">
                                {collection.title}
                            </div>
                        )
                        }

                        <div className="category-title">{collection.title}</div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
