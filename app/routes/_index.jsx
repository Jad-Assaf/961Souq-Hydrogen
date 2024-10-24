import React from 'react';
import ProductRow from '../components/ProductRow';

export default function HomePage() {
  const collections = [
    'featured-collection',
    'new-arrivals',
    'best-sellers',
  ]; // Add the collection handles you want to display

  return (
    <div>
      <header>
        <h1>Welcome to Our Store</h1>
      </header>
      {collections.map((handle) => (
        <div key={handle} className="homepage-row">
          <h2>{handle.replace('-', ' ').toUpperCase()}</h2>
          <ProductRow collectionHandle={handle} />
        </div>
      ))}
    </div>
  );
}
