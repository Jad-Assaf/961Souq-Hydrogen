// src/pages/index.server.jsx

import ProductRow from '../components/ProductRow';

export default function HomePage() {
  const collectionHandles = ['featured-collection', 'new-arrivals', 'best-sellers'];

  return (
    <div>
      <header>
        <h1>Welcome to Our Store</h1>
      </header>
      {collectionHandles.map((handle) => (
        <section key={handle}>
          <h2>{handle.replace('-', ' ').toUpperCase()}</h2>
          <Suspense fallback={<p>Loading products...</p>}>
            <ProductRow handle={handle} />
          </Suspense>
        </section>
      ))}
    </div>
  );
}
