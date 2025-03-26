import {Link} from '@remix-run/react';
import '../styles/apple-virtual-showroom.css';
import {useState, useEffect} from 'react';

// Manually define your product data with fixed positions
const products = [
  {
    id: '1',
    title:
      'Apple MacBook Pro MRX73B/A M3 Pro Chip - 14" - 12‑core CPU - 18GB Ram - 1TB SSD - 18‑core GPU - Silver',
    handle:
      'apple-macbook-pro-mrx73b-a-m3-pro-chip-14-12-core-cpu-18gb-ram-1tb-ssd-18-core-gpu-silver',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Apple-Macbook-Pro-13-inch-Silver-M3-Pro-2_566cd059-bd2d-49b4-8a99-f619d65b3e30.jpg?v=1699371333',
    },
    position: {x: 271, y: 848}, // Original position in pixels (base width: 2325px)
  },
  {
    id: '2',
    title:
      'Apple MacBook Pro MTL83/A M3 Chip - 14" - 8‑core CPU - 8GB Ram - 1TB SSD - 10‑core GPU - Space Gray',
    handle:
      'apple-macbook-pro-mtl83-a-m3-chip-14-8-core-cpu-8gb-ram-1tb-ssd-10-core-gpu-space-gray',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Apple-MacBook-Pro-14-inch-M3-Space-Gray_857d0249-851e-4ef5-94d6-62070674bc19.jpg?v=1699613635',
    },
    position: {x: 508, y: 759},
  },
  {
    id: '3',
    title:
      'Apple iMac 24" (Late 2024) - M4 Chip - 10-Core CPU - 10-Core GPU - 24GB RAM - 512GB SSD',
    handle:
      'apple-imac-24-late-2024-m4-chip-10-core-cpu-10-core-gpu-24gb-ram-512gb-ssd',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/imac_d2a63e75-b90d-403b-b381-7a82993b5604.jpg?v=1731316510',
    },
    position: {x: 775, y: 570},
  },
  {
    id: '4',
    title:
      'Apple MacBook Pro 16" M4 Max Chip - 16‑core CPU - 128GB Ram - 2TB SSD - 40‑core GPU',
    handle:
      'apple-macbook-pro-16-m4-max-chip-16-core-cpu-128gb-ram-2tb-ssd-40-core-gpu',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/16_-MacBook-Pro-4.jpg?v=1731315305',
    },
    position: {x: 392, y: 804},
  },
  // Add more products as needed with their respective positions
];

export default function ProductsImage() {
  useEffect(() => {
    // Disable zooming via pinch gestures on mobile
    const preventZoom = (e) => {
      if (e.touches && e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // Disable zooming via mouse wheel or keyboard shortcuts
    const preventWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };

    // Attach event listeners
    window.addEventListener('touchmove', preventZoom, {passive: false});
    window.addEventListener('wheel', preventWheel, {passive: false});

    return () => {
      window.removeEventListener('touchmove', preventZoom);
      window.removeEventListener('wheel', preventWheel);
    };
  }, []);

  return (
    <div className="showroom-container">
      <nav className="vr-header">
        <p>Home</p>
        <div className="vr-header__logo">
          <a href="https://961souq.com">
            <img
              src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Black-961souqLogo.png?v=1742979250"
              alt="961 Souq Logo"
              width={100}
              height={100}
            />
          </a>
        </div>
        <p>Next Showroom</p>
      </nav>
      <ProductImageWithMarkers products={products} />
    </div>
  );
}

function ProductImageWithMarkers({products}) {
  const baseImageUrl =
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/MAR_26.jpg?v=1742983051';

  return (
    <div className="image-container">
      {/* Base Image with an id to reference for scaling */}
      <img
        id="base-image"
        src={baseImageUrl}
        alt="Product showcase"
        className="showroom-image"
      />

      {/* Product Markers */}
      {products.map((product) => (
        <ProductMarker
          key={product.id}
          product={product}
          position={product.position}
        />
      ))}
    </div>
  );
}

function ProductMarker({product, position}) {
  const [scaledPos, setScaledPos] = useState(position);

  useEffect(() => {
    function updatePosition() {
      const img = document.getElementById('base-image');
      if (img) {
        const originalWidth = 2325; // Base width for the image positions
        // Only scale if the viewport is wider than the original width
        if (window.innerWidth < originalWidth) {
          setScaledPos(position);
          return;
        }
        const currentWidth = img.clientWidth;
        // Calculate a uniform scale factor based on width
        const scale = currentWidth / originalWidth;
        setScaledPos({
          x: position.x * scale,
          y: position.y * scale,
        });
      }
    }

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [position]);

  return (
    <div
      className="product-marker"
      style={{left: `${scaledPos.x}px`, top: `${scaledPos.y}px`}}
    >
      {/* Marker dot */}
      <div className="marker-dot"></div>

      {/* Product tooltip */}
      <div className="product-tooltip">
        {product.featuredImage?.url && (
          <Link
            to={`/products/${product.handle}`}
            className="product-link"
            target="_blank"
          >
            <img
              src={product.featuredImage.url}
              alt={product.title}
              className="product-image"
            />
            <h3 className="product-title">{product.title}</h3>
            View Product →
          </Link>
        )}
      </div>
    </div>
  );
}
