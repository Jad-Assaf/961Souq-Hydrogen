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
    position: {x: 472, y: 685}, // Original position in pixels (base width: 2325px)
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
    position: {x: 568, y: 649},
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
    position: {x: 565, y: 435},
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
    position: {x: 665, y: 611},
  },
  {
    id: '5',
    title: 'Apple Magic Trackpad',
    handle: 'apple-magic-trackpad-touch-surface?Type=Lightning&Color=White',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Apple-Magic-Trackpad-2-1.jpg?v=1741095445',
    },
    position: {x: 534, y: 520},
  },
  {
    id: '6',
    title: 'Apple Magic Keyboard with Touch ID',
    handle: 'apple-magic-keyboard-with-touch-id',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/products/a1_6bbe2d63-03ae-4b66-b87e-f75d66cf4a38.jpg?v=1668854165',
    },
    position: {x: 592, y: 500},
  },
  {
    id: '7',
    title: 'Apple Magic Mouse (USB-C)',
    handle: 'apple-magic-mouse-usb-c?Color=White',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/apple-magic-mouse-new.jpg?v=1736263463',
    },
    position: {x: 640, y: 484},
  },
  {
    id: '8',
    title: 'Apple Magic Trackpad - Black',
    handle: 'apple-magic-trackpad-touch-surface?Type=Lightning&Color=Black',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/products/Apple-Magic-Trackpad-Touch-Surface-5.jpg?v=1656145311',
    },
    position: {x: 863, y: 412},
  },
  {
    id: '9',
    title: 'Apple Magic Keyboard With Touch ID and Numeric Keypad - Black',
    handle: 'apple-magic-keyboard-with-touch-id-and-numeric-keypad?Color=Black',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/products/q1_ef6ab641-da3c-4873-a805-1d01d948413a.jpg?v=1688999035',
    },
    position: {x: 917, y: 395},
  },
  {
    id: '10',
    title: 'Apple Magic Mouse (USB-C) - Black',
    handle: 'apple-magic-mouse-usb-c?Color=Black',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/apple-magic-mouse-black_eada3581-0aec-415d-8714-f6af2b58cf2d.jpg?v=1736263463',
    },
    position: {x: 957, y: 382},
  },
  {
    id: '11',
    title:
      'Apple Mac Studio MQH63 - 24-Core M2 Ultra - 64GB Ram - 1TB SSD - 60-Core GPU',
    handle:
      'apple-mac-studio-mqh63-24-core-m2-ultra-64gb-ram-1tb-ssd-60-core-gpu',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Apple-Mac-Studio-MQH63-2.jpg?v=1688813295',
    },
    position: {x: 955, y: 354},
  },
  {
    id: '12',
    title: 'Apple 27" 5K Studio Display',
    handle: 'apple-mk0u3ll-a-27-5k-studio-display',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/products/MK0U3-2.jpg?v=1649410393',
    },
    position: {x: 880, y: 332},
  },
];

export default function ProductsImage() {
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
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/MAR_28.jpg?v=1743167596&quality=100';

  useEffect(() => {
    function scrollToCustomPosition() {
      const container = document.querySelector('.image-container');

      if (container && window.innerWidth < 768) {
        container.scrollTo({
          left: 300,
          top: 0,
          behavior: 'smooth', // Smooth scrolling effect
        });
      }
    }

    setTimeout(scrollToCustomPosition, 200); // Delay ensures image loads before scrolling
  }, []);

  return (
    <div className="image-container">
      <img
        id="base-image"
        src={baseImageUrl}
        alt="Product showcase"
        className="showroom-image"
      />
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
        const originalWidth = 2048; // Base width for the image positions
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
