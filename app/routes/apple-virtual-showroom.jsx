import {Link} from '@remix-run/react';
import '../styles/apple-virtual-showroom.css';
import {useState, useEffect, useRef, useMemo} from 'react';

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
    id: '44',
    title: 'Dyson Purifier Cool Formaldehyde™ TP09 purifying fan',
    handle: 'dyson-purifier-cool-formaldehyde-tp09-purifying-fan-white-gold',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/DysonPurifierCoolFormaldehyde_TP09purifyingfan_White_Gold.jpg?v=1690444097',
    },
    position: {x: 1096, y: 354},
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
  {
    id: '13',
    title: 'Apple Watch Ultra 2 with Trail Loop',
    handle: 'apple-watch-ultra-2-trail-loop?Color=Trail_Orange_Beige',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Apple-Watch-Ultra-2-Trail-Loop-6_8bff3b40-9087-4b18-b661-db01fbaa1cc8.jpg?v=1697811500',
    },
    position: {x: 120, y: 658},
  },
  {
    id: '14',
    title: 'Apple AirPods Pro 2nd Gen',
    handle: 'apple-airpods-pro-2',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/products/f2_41a37271-e9c7-4e60-a57a-1880219120fe.jpg?v=1669370872',
    },
    position: {x: 163, y: 642},
  },
  {
    id: '15',
    title: 'Apple AirPods Max USB-C',
    handle: 'apple-airpods-max-2024-usb-c',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Apple-AirPods-Max-_2024_-5.jpg?v=1727351056',
    },
    position: {x: 211, y: 565},
  },
  {
    id: '16',
    title: 'Apple AirTag Pack of 4',
    handle: 'apple-airtag-pack-of-4',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/products/aritag.jpg?v=1669125396',
    },
    position: {x: 237, y: 635},
  },
  {
    id: '17',
    title: 'Apple AirPods 4',
    handle: 'apple-airpods-4',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/AirPods-4-3_488cca85-2c6b-4804-8c0c-4924eb4c28b9.jpg?v=1726653881',
    },
    position: {x: 283, y: 603},
  },
  {
    id: '18',
    title: 'Apple Watch Series 10',
    handle: 'apple-watch-series-10',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Apple-Watch-Series-10.jpg?v=1726745771',
    },
    position: {x: 335, y: 587},
  },
  {
    id: '19',
    title:
      'Apple MacBook Pro 16" M4 Pro Chip - 14‑core CPU - 48GB Ram - 512GB SSD - 20‑core GPU',
    handle:
      'apple-macbook-pro-16-m4-pro-chip-14-core-cpu-48gb-ram-512gb-ssd-20-core-gpu',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/16_-MacBook-Pro-4.jpg?v=1731315305',
    },
    position: {x: 862, y: 537},
  },
  {
    id: '20',
    title:
      'Apple MacBook Pro 16" M4 Pro Chip - 14‑core CPU - 24GB Ram - 512GB SSD - 20‑core GPU',
    handle:
      'apple-macbook-pro-16-m4-pro-chip-14-core-cpu-24gb-ram-512gb-ssd-20-core-gpu',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/16_-MacBook-Pro-4.jpg?v=1731315305',
    },
    position: {x: 970, y: 496},
  },
  {
    id: '21',
    title:
      'Apple MacBook Air - 15" - M4 chip - 10-core CPU - 10-core GPU - 32GB Ram - 1TB SSD',
    handle:
      'apple-macbook-air-15-m4-chip-10-core-cpu-10-core-gpu-32gb-ram-1tb-ssd',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Apple-MacBook-Air-15-midnight_1b238c25-cfac-4c30-accb-ee269e44a5d3.jpg?v=1742382310',
    },
    position: {x: 1217, y: 496},
  },
  {
    id: '22',
    title:
      'Apple MacBook Air - 15" - M4 chip - 10-core CPU - 10-core GPU - 24GB Ram - 512GB SSD',
    handle:
      'apple-macbook-air-15-m4-chip-10-core-cpu-10-core-gpu-24gb-ram-512gb-ssd?Color=Silver',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Apple-MacBook-Air-15-silver.jpg?v=1742382310',
    },
    position: {x: 1311, y: 544},
  },
  {
    id: '23',
    title:
      'Apple MacBook Air - 15" - M4 chip - 10-core CPU - 10-core GPU - 16GB Ram - 512GB SSD - Sky Blue',
    handle:
      'apple-macbook-air-15-m4-chip-10-core-cpu-10-core-gpu-16gb-ram-512gb-ssd?Color=Sky+Blue',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Apple-MacBook-Air-15.jpg?v=1742382310',
    },
    position: {x: 1467, y: 624},
  },
  {
    id: '24',
    title:
      'Apple MacBook Air - 13" - M4 chip - 10-core CPU - 10-core GPU - 32GB Ram - 1TB SSD',
    handle:
      'apple-macbook-air-13-m4-chip-10-core-cpu-10-core-gpu-32gb-ram-1tb-ssd',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/13-inch-MacBook-Air---Midnight_7db70dc2-dc3e-4ccc-b937-892fc8a56b62.jpg?v=1741871240',
    },
    position: {x: 1550, y: 665},
  },
  {
    id: '25',
    title:
      'Apple MacBook Air - 13" - M4 chip - 10-core CPU - 10-core GPU - 24GB Ram - 512GB SSD',
    handle:
      'apple-macbook-air-13-m4-chip-10-core-cpu-10-core-gpu-24gb-ram-512gb-ssd',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/13-inch-MacBook-Air.jpg?v=1741871240',
    },
    position: {x: 1634, y: 706},
  },
  {
    id: '26',
    title: 'Apple iPhone 16',
    handle: 'apple-iphone-16',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/iPhone-16-16.jpg?v=1726644398',
    },
    position: {x: 1200, y: 355},
  },
  {
    id: '27',
    title: 'Apple iPhone 16 Plus',
    handle: 'apple-iphone-16-plus',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/iPhone-16-Plus-4.jpg?v=1726645785',
    },
    position: {x: 1250, y: 380},
  },
  {
    id: '28',
    title: 'Apple iPhone 16 Pro',
    handle: 'apple-iphone-16-pro',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/iPhone-16-Pro-2.jpg?v=1726647260',
    },
    position: {x: 1295, y: 400},
  },
  {
    id: '29',
    title: 'Apple iPhone 16 Pro Max',
    handle: 'apple-iphone-16-pro-max',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/iPhone-16-Pro-Max-3.jpg?v=1726647934',
    },
    position: {x: 1340, y: 420},
  },
  {
    id: '30',
    title: 'Apple iPad Pro M4 13" (2024)',
    handle: 'apple-ipad-pro-m4-13-2024-wifi-standard-glass',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/ipad-pro-5.jpg?v=1716018466',
    },
    position: {x: 1478, y: 472},
  },
  {
    id: '31',
    title: 'Apple iPad Pro M4 11" (2024)',
    handle:
      'apple-ipad-pro-11-m4-2024-with-m4-chip-wifi-standard-glass?Color=Space+Black&Storage=256GB',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/ipad-pro.jpg?v=1716017288',
    },
    position: {x: 1531, y: 499},
  },
  {
    id: '32',
    title: 'Apple iPad Mini 7 ',
    handle: 'apple-ipad-mini-a17-pro-chip-space-gray-wifi?Storage=128GB',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Apple---iPad-mini-_A17-Pro-chip_-1.jpg?v=1730204758',
    },
    position: {x: 1585, y: 522},
  },
  {
    id: '33',
    title: 'Apple iPad Air 11" M3 Chip (2025)',
    handle: 'apple-ipad-air-11-m3-chip-2025-wi-fi',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/iPad-Air-m3-11_53fd0f52-4257-4556-8a1e-79acb9744592.jpg?v=1742986604',
    },
    position: {x: 1640, y: 547},
  },
  {
    id: '36',
    title: 'Apple Pencil Pro',
    handle: 'apple-pencil-pro',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/apple-pencil-pro.jpg?v=1716023207',
    },
    position: {x: 1787, y: 614},
  },
  {
    id: '37',
    title: 'Apple Pencil (Gen 2)',
    handle: 'apple-pencil-gen-2-for-ipad-pro-11-12-9-inch',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/products/14-1_729d245f-d209-4099-b664-61c9e275eb5a.jpg?v=1671033703',
    },
    position: {x: 1820, y: 627},
  },
  {
    id: '38',
    title: 'Apple Pencil (USB-C)',
    handle: 'apple-pencil-usb-c',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/MUWA3.jpg?v=1701505583',
    },
    position: {x: 1852, y: 639},
  },
  {
    id: '39',
    title: 'Apple HomePod (2nd Gen)',
    handle: 'apple-homepod-2nd-gen',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/products/Apple-HomePod-2nd-Gen-1.jpg?v=1675769218',
    },
    position: {x: 1890, y: 643},
  },
  {
    id: '40',
    title: 'Apple TV 4K (3rd generation) Wi-Fi + Ethernet - 128GB',
    handle: 'apple-tv-4k-3rd-generation-wi-fi-ethernet-128gb-storage',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Apple-TV-4K-_3rd-generation.jpg?v=1688201168',
    },
    position: {x: 1938, y: 671},
  },
];

export default function ProductsImage() {
  return (
    <div className="showroom-container">
      <nav className="vr-header">
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
      </nav>
      <ProductImageWithMarkers products={products} />
    </div>
  );
}

function ProductImageWithMarkers({products}) {
  const lowQualityUrl =
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/apr3.jpg?v=1743659665&quality=10';
  const highQualityUrl =
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/apr3.jpg?v=1743659665&quality=100';
  const [isHighQualityLoaded, setIsHighQualityLoaded] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState(lowQualityUrl);

  useEffect(() => {
    const img = new Image();
    img.src = highQualityUrl;
    img.onload = () => {
      setCurrentImageSrc(highQualityUrl);
      setIsHighQualityLoaded(true);
    };

    // Cleanup
    return () => {
      img.onload = null;
    };
  }, [highQualityUrl]);

  useEffect(() => {
    function scrollToCustomPosition() {
      const container = document.querySelector('.image-container');
      if (container && window.innerWidth < 768) {
        container.scrollTo({
          left: 300,
          top: 0,
          behavior: 'smooth',
        });
      }
    }
    setTimeout(scrollToCustomPosition, 200);
  }, []);

  return (
    <div className="image-container">
      <img
        id="base-image"
        src={currentImageSrc}
        alt="Product showcase"
        className={`showroom-image ${!isHighQualityLoaded ? 'blur' : ''}`}
      />
      {products.map((product) => (
        <ProductMarker
          key={product.id}
          product={product}
          position={product.position}
        />
      ))}
      <HomeMarker position={{x: 488, y: 235}} />
      <AppleMarker position={{x: 1445, y: 244}} />
      <SamsungMarker position={{x: 1848, y: 435}} />
      <PrevMarker position={{x: 115, y: 368}} />
    </div>
  );
}

function HomeMarker({position}) {
  const [scaledPos, setScaledPos] = useState(position);
  const [randomDelay, setRandomDelay] = useState(0);

  // Set a random delay on client mount
  useEffect(() => {
    setRandomDelay(Math.random() * 1.25); // animation duration is 1.25s
  }, []);

  useEffect(() => {
    function updatePosition() {
      const img = document.getElementById('base-image');
      if (img) {
        const originalWidth = 2048;
        if (window.innerWidth < originalWidth) {
          setScaledPos(position);
          return;
        }
        const currentWidth = img.clientWidth;
        const scale = currentWidth / originalWidth;
        setScaledPos({x: position.x * scale, y: position.y * scale});
      }
    }
    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [position]);

  return (
    <div
      className="homee home-marker"
      style={{left: `${scaledPos.x}px`, top: `${scaledPos.y}px`}}
    >
      <div
        className="pulsating-circle"
        style={{'--delay': `-${randomDelay}s`}}
      ></div>
      <a href="/" className="home-tooltip">
        Back To HomePage
      </a>
    </div>
  );
}

function AppleMarker({position}) {
  const [scaledPos, setScaledPos] = useState(position);
  const [randomDelay, setRandomDelay] = useState(0);

  // Set a random delay on client mount
  useEffect(() => {
    setRandomDelay(Math.random() * 1.25); // animation duration is 1.25s
  }, []);

  useEffect(() => {
    function updatePosition() {
      const img = document.getElementById('base-image');
      if (img) {
        const originalWidth = 2048;
        if (window.innerWidth < originalWidth) {
          setScaledPos(position);
          return;
        }
        const currentWidth = img.clientWidth;
        const scale = currentWidth / originalWidth;
        setScaledPos({x: position.x * scale, y: position.y * scale});
      }
    }
    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [position]);

  return (
    <div
      className="apple home-marker"
      style={{left: `${scaledPos.x}px`, top: `${scaledPos.y}px`}}
    >
      <div
        className="pulsating-circle"
        style={{'--delay': `-${randomDelay}s`}}
      ></div>
      <a href="/collections/apple" className="home-tooltip">
        All Apple Products
      </a>
    </div>
  );
}

function SamsungMarker({position}) {
  const [scaledPos, setScaledPos] = useState(position);
  const [randomDelay, setRandomDelay] = useState(0);

  // Set a random delay on client mount
  useEffect(() => {
    setRandomDelay(Math.random() * 1.25); // animation duration is 1.25s
  }, []);

  useEffect(() => {
    function updatePosition() {
      const img = document.getElementById('base-image');
      if (img) {
        const originalWidth = 2048;
        if (window.innerWidth < originalWidth) {
          setScaledPos(position);
          return;
        }
        const currentWidth = img.clientWidth;
        const scale = currentWidth / originalWidth;
        setScaledPos({x: position.x * scale, y: position.y * scale});
      }
    }
    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [position]);

  return (
    <div
      className="home-marker samsung"
      style={{left: `${scaledPos.x}px`, top: `${scaledPos.y}px`}}
    >
      <div
        // href="/collections/apple"
        className="pulsating-circle"
        style={{'--delay': `-${randomDelay}s`}}
      ></div>
      <div className="home-tooltip">Coming Soon!</div>
    </div>
  );
}

function PrevMarker({position}) {
  const [scaledPos, setScaledPos] = useState(position);
  const [randomDelay, setRandomDelay] = useState(0);

  // Set a random delay on client mount
  useEffect(() => {
    setRandomDelay(Math.random() * 1.25); // animation duration is 1.25s
  }, []);

  useEffect(() => {
    function updatePosition() {
      const img = document.getElementById('base-image');
      if (img) {
        const originalWidth = 2048;
        if (window.innerWidth < originalWidth) {
          setScaledPos(position);
          return;
        }
        const currentWidth = img.clientWidth;
        const scale = currentWidth / originalWidth;
        setScaledPos({x: position.x * scale, y: position.y * scale});
      }
    }
    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [position]);

  return (
    <div
      className="home-marker previous"
      style={{left: `${scaledPos.x}px`, top: `${scaledPos.y}px`}}
    >
      <div
        // href="/collections/apple"
        className="pulsating-circle"
        style={{'--delay': `-${randomDelay}s`}}
      ></div>
      <div className="home-tooltip">Coming Soon!</div>
    </div>
  );
}

function ProductMarker({product, position}) {
  const [scaledPos, setScaledPos] = useState(position);
  const [randomDelay, setRandomDelay] = useState(0);

  // Set a random delay on client mount
  useEffect(() => {
    setRandomDelay(Math.random() * 10);
  }, []);

  useEffect(() => {
    function updatePosition() {
      const img = document.getElementById('base-image');
      if (img) {
        const originalWidth = 2048;
        if (window.innerWidth < originalWidth) {
          setScaledPos(position);
          return;
        }
        const currentWidth = img.clientWidth;
        const scale = currentWidth / originalWidth;
        setScaledPos({x: position.x * scale, y: position.y * scale});
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
      <div
        className="pulsating-circle"
        style={{'--delay': `-${randomDelay}s`}}
      ></div>
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
            <h3 className="product-title-v">{product.title}</h3>
            <span>View Product</span>
          </Link>
        )}
      </div>
    </div>
  );
}

