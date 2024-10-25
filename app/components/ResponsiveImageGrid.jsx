import React, { useEffect, useState } from 'react';
import { CollectionDisplay } from '../components/CollectionDisplay';

// Inter-row images to display between ProductRow components
const interRowImages = [
    {
        url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/apple-products_29a11658-9601-44a9-b13a-9a52c10013be.jpg?v=1728311525',
        altText: 'Placeholder Image 1'
    },
    {
        url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/APPLE-IPHONE-16-wh.jpg?v=1728307748',
        altText: 'Placeholder Image 2'
    },
    {
        url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/ps-studios.jpg?v=1728486402',
        altText: 'Placeholder Image 3'
    },
    {
        url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/cmf-phone-1-banner-1.jpg?v=1727944715',
        altText: 'Placeholder Image 4'
    },
];

export default function HomePage() {
    const [collections, setCollections] = useState([]);

    // Fetch collections dynamically on component mount
    useEffect(() => {
        async function fetchCollections() {
            try {
                const response = await fetch('/api/collections'); // Update to your API route
                const data = await response.json();
                setCollections(data.collections);
            } catch (error) {
                console.error('Error fetching collections:', error);
            }
        }

        fetchCollections();
    }, []);

    return (
        <div>
            <h1>Shop Our Collections</h1>
            <CollectionDisplay collections={collections} interRowImages={interRowImages} />
        </div>
    );
}
