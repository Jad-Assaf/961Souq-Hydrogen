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
    position: {x: 547, y: 791}, // Original position in pixels (base width: 2325px)
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
    position: {x: 656, y: 750},
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
    position: {x: 645, y: 500},
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
    position: {x: 766, y: 708},
  },
  {
    id: '5',
    title: 'Apple Magic Trackpad',
    handle: 'apple-magic-trackpad-touch-surface?Type=Lightning&Color=White',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Apple-Magic-Trackpad-2-1.jpg?v=1741095445',
    },
    position: {x: 612, y: 596},
  },
  {
    id: '6',
    title: 'Apple Magic Keyboard with Touch ID',
    handle: 'apple-magic-keyboard-with-touch-id',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/products/a1_6bbe2d63-03ae-4b66-b87e-f75d66cf4a38.jpg?v=1668854165',
    },
    position: {x: 676, y: 574},
  },
  {
    id: '7',
    title: 'Apple Magic Mouse (USB-C)',
    handle: 'apple-magic-mouse-usb-c?Color=White',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/apple-magic-mouse-new.jpg?v=1736263463',
    },
    position: {x: 730, y: 555},
  },
  {
    id: '8',
    title: 'Apple Magic Trackpad - Black',
    handle: 'apple-magic-trackpad-touch-surface?Type=Lightning&Color=Black',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/products/Apple-Magic-Trackpad-Touch-Surface-5.jpg?v=1656145311',
    },
    position: {x: 986, y: 471},
  },
  {
    id: '9',
    title: 'Apple Magic Keyboard With Touch ID and Numeric Keypad - Black',
    handle: 'apple-magic-keyboard-with-touch-id-and-numeric-keypad?Color=Black',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/products/q1_ef6ab641-da3c-4873-a805-1d01d948413a.jpg?v=1688999035',
    },
    position: {x: 1045, y: 452},
  },
  {
    id: '10',
    title: 'Apple Magic Mouse (USB-C) - Black',
    handle: 'apple-magic-mouse-usb-c?Color=Black',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/apple-magic-mouse-black_eada3581-0aec-415d-8714-f6af2b58cf2d.jpg?v=1736263463',
    },
    position: {x: 1090, y: 435},
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
    position: {x: 1095, y: 410},
  },
  {
    id: '44',
    title: 'Dyson Purifier Cool Formaldehyde™ TP09 purifying fan',
    handle: 'dyson-purifier-cool-formaldehyde-tp09-purifying-fan-white-gold',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/DysonPurifierCoolFormaldehyde_TP09purifyingfan_White_Gold.jpg?v=1690444097',
    },
    position: {x: 1250, y: 385},
  },
  {
    id: '12',
    title: 'Apple 27" 5K Studio Display',
    handle: 'apple-mk0u3ll-a-27-5k-studio-display',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/products/MK0U3-2.jpg?v=1649410393',
    },
    position: {x: 1000, y: 382},
  },
  {
    id: '13',
    title: 'Apple Watch Ultra 2 with Trail Loop',
    handle: 'apple-watch-ultra-2-trail-loop?Color=Trail_Orange_Beige',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Apple-Watch-Ultra-2-Trail-Loop-6_8bff3b40-9087-4b18-b661-db01fbaa1cc8.jpg?v=1697811500',
    },
    position: {x: 138, y: 754},
  },
  {
    id: '14',
    title: 'Apple AirPods Pro 2nd Gen',
    handle: 'apple-airpods-pro-2',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/products/f2_41a37271-e9c7-4e60-a57a-1880219120fe.jpg?v=1669370872',
    },
    position: {x: 188, y: 735},
  },
  {
    id: '15',
    title: 'Apple AirPods Max USB-C',
    handle: 'apple-airpods-max-2024-usb-c',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Apple-AirPods-Max-_2024_-5.jpg?v=1727351056',
    },
    position: {x: 240, y: 645},
  },
  {
    id: '16',
    title: 'Apple AirTag Pack of 4',
    handle: 'apple-airtag-pack-of-4',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/products/aritag.jpg?v=1669125396',
    },
    position: {x: 268, y: 720},
  },
  {
    id: '17',
    title: 'Apple AirPods 4',
    handle: 'apple-airpods-4',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/AirPods-4-3_488cca85-2c6b-4804-8c0c-4924eb4c28b9.jpg?v=1726653881',
    },
    position: {x: 324, y: 690},
  },
  {
    id: '18',
    title: 'Apple Watch Series 10',
    handle: 'apple-watch-series-10',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Apple-Watch-Series-10.jpg?v=1726745771',
    },
    position: {x: 382, y: 669},
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
    position: {x: 996, y: 621},
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
    position: {x: 1119, y: 574},
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
    position: {x: 1377, y: 576},
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
    position: {x: 1480, y: 630},
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
    position: {x: 1663, y: 721},
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
    position: {x: 1755, y: 766},
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
    position: {x: 1850, y: 814},
  },
  {
    id: '26',
    title: 'Apple iPhone 16',
    handle: 'apple-iphone-16',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/iPhone-16-16.jpg?v=1726644398',
    },
    position: {x: 1371, y: 402},
  },
  {
    id: '27',
    title: 'Apple iPhone 16 Plus',
    handle: 'apple-iphone-16-plus',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/iPhone-16-Plus-4.jpg?v=1726645785',
    },
    position: {x: 1427, y: 430},
  },
  {
    id: '28',
    title: 'Apple iPhone 16 Pro',
    handle: 'apple-iphone-16-pro',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/iPhone-16-Pro-2.jpg?v=1726647260',
    },
    position: {x: 1473, y: 453},
  },
  {
    id: '29',
    title: 'Apple iPhone 16 Pro Max',
    handle: 'apple-iphone-16-pro-max',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/iPhone-16-Pro-Max-3.jpg?v=1726647934',
    },
    position: {x: 1524, y: 478},
  },
  {
    id: '30',
    title: 'Apple iPad Pro M4 13" (2024)',
    handle: 'apple-ipad-pro-m4-13-2024-wifi-standard-glass',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/ipad-pro-5.jpg?v=1716018466',
    },
    position: {x: 1685, y: 540},
  },
  {
    id: '31',
    title: 'Apple iPad Pro M4 11" (2024)',
    handle:
      'apple-ipad-pro-11-m4-2024-with-m4-chip-wifi-standard-glass?Color=Space+Black&Storage=256GB',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/ipad-pro.jpg?v=1716017288',
    },
    position: {x: 1747, y: 568},
  },
  {
    id: '32',
    title: 'Apple iPad Mini 7 ',
    handle: 'apple-ipad-mini-a17-pro-chip-space-gray-wifi?Storage=128GB',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Apple---iPad-mini-_A17-Pro-chip_-1.jpg?v=1730204758',
    },
    position: {x: 1809, y: 594},
  },
  {
    id: '33',
    title: 'Apple iPad Air 11" M3 Chip (2025)',
    handle: 'apple-ipad-air-11-m3-chip-2025-wi-fi',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/iPad-Air-m3-11_53fd0f52-4257-4556-8a1e-79acb9744592.jpg?v=1742986604',
    },
    position: {x: 1874, y: 622},
  },
  {
    id: '36',
    title: 'Apple Pencil Pro',
    handle: 'apple-pencil-pro',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/apple-pencil-pro.jpg?v=1716023207',
    },
    position: {x: 2037, y: 699},
  },
  {
    id: '37',
    title: 'Apple Pencil (Gen 2)',
    handle: 'apple-pencil-gen-2-for-ipad-pro-11-12-9-inch',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/products/14-1_729d245f-d209-4099-b664-61c9e275eb5a.jpg?v=1671033703',
    },
    position: {x: 2073, y: 713},
  },
  {
    id: '38',
    title: 'Apple Pencil (USB-C)',
    handle: 'apple-pencil-usb-c',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/MUWA3.jpg?v=1701505583',
    },
    position: {x: 2109, y: 727},
  },
  {
    id: '39',
    title: 'Apple HomePod (2nd Gen)',
    handle: 'apple-homepod-2nd-gen',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/products/Apple-HomePod-2nd-Gen-1.jpg?v=1675769218',
    },
    position: {x: 2157, y: 723},
  },
  {
    id: '40',
    title: 'Apple TV 4K (3rd generation) Wi-Fi + Ethernet - 128GB',
    handle: 'apple-tv-4k-3rd-generation-wi-fi-ethernet-128gb-storage',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Apple-TV-4K-_3rd-generation.jpg?v=1688201168',
    },
    position: {x: 2208, y: 751},
  },
];

export default function ProductsImage() {
  return (
    <div className="showroom-container">
      <nav className="vr-header">
        <div className="vr-header__logo">
          <a href="/">
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

function ProductImageWithMarkers({ products }) {
  const lowQualityUrl =
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/apple-new_100a4675-c36c-45e7-b461-f0b618aa818f.jpg?v=1746170577&quality=10';
  const highQualityUrl =
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/apple-new_100a4675-c36c-45e7-b461-f0b618aa818f.jpg?v=1746170577&quality=100';
  const [isHighQualityLoaded, setIsHighQualityLoaded] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState(lowQualityUrl);
  const containerRef = useRef(null);

  useEffect(() => {
    const img = new Image();
    img.src = highQualityUrl;
    img.onload = () => {
      setCurrentImageSrc(highQualityUrl);
      setIsHighQualityLoaded(true);
    };

    return () => {
      img.onload = null;
    };
  }, [highQualityUrl]);

  // Drag-to-scroll functionality
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isDown = false;
    let startX;
    let startY;
    let scrollLeft;
    let scrollTop;

    const handleMouseDown = (e) => {
      isDown = true;
      container.classList.add('active'); // Optional: change cursor/style
      startX = e.pageX - container.offsetLeft;
      startY = e.pageY - container.offsetTop;
      scrollLeft = container.scrollLeft;
      scrollTop = container.scrollTop;
    };

    const handleMouseLeave = () => {
      isDown = false;
      container.classList.remove('active');
    };

    const handleMouseUp = () => {
      isDown = false;
      container.classList.remove('active');
    };

    const handleMouseMove = (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const y = e.pageY - container.offsetTop;
      const walkX = x - startX;
      const walkY = y - startY;
      container.scrollLeft = scrollLeft - walkX;
      container.scrollTop = scrollTop - walkY;
    };

    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mousemove', handleMouseMove);

    // Disable right-click context menu
    const disableContextMenu = (e) => {
      e.preventDefault();
    };
    container.addEventListener('contextmenu', disableContextMenu);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('contextmenu', disableContextMenu);
    };
  }, []);

  // Optional: Custom mobile scroll position
  useEffect(() => {
    function scrollToCustomPosition() {
      const container = containerRef.current;
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
    <div className="image-container" ref={containerRef}>
      <DragToMoveIndicator containerRef={containerRef} />
      <img
        id="base-image"
        src={currentImageSrc}
        alt="Product showcase"
        className={`showroom-image ${!isHighQualityLoaded ? 'blur' : ''}`}
        width={4096}
        height={2160}
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
      />
      {products.map((product) => (
        <ProductMarker
          key={product.id}
          product={product}
          position={product.position}
        />
      ))}
      {/* <HomeMarker position={{ x: 540, y: 250 }} />
      <AppleMarker position={{ x: 1625, y: 250 }} /> */}
      <SamsungMarker position={{x: 2085, y: 470}} />
      <PrevMarker position={{x: 105, y: 395}} />
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
        const originalWidth = 2335;
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
        const originalWidth = 2335;
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
        const originalWidth = 2335;
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
      <a href='/samsung-virtual-showroom' className="home-tooltip">Samsung Showroom</a>
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
        const originalWidth = 2335;
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
      <a href='/gaming-room' className="home-tooltip">Gaming Room</a>
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
        const originalWidth = 2335;
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

function DragToMoveIndicator({containerRef}) {
  const [visible, setVisible] = useState(false);

  // show when base image loads
  useEffect(() => {
    const img = document.getElementById('base-image');
    if (!img) return;
    const handleLoad = () => setVisible(true);
    img.addEventListener('load', handleLoad);
    return () => img.removeEventListener('load', handleLoad);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // hide on first drag
    const handleMouseDown = () => {
      setVisible(false);
      cleanup();
    };

    // auto-hide after 5s
    const timeout = setTimeout(() => setVisible(false), 50000);

    function cleanup() {
      container.removeEventListener('mousedown', handleMouseDown);
      clearTimeout(timeout);
    }

    container.addEventListener('mousedown', handleMouseDown);
    return () => cleanup();
  }, [containerRef]);

  if (!visible) return null;

  return (
    <div
      className="drag-to-move-indicator"
      style={{
        position: 'absolute',
        top: '55%',
        left: '55%',
        transform: 'translate(-50%, -50%)',
        zIndex: 9999,
        background: 'rgba(0,0,0,0.6)',
        color: '#fff',
        padding: '1em 1em',
        borderRadius: '4px',
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '15px',
        backdropFilter: 'blur(10px)'
      }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        stroke="transparent"
        style={{width: '30px', height: '30px'}}
      >
        <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
        <g
          id="SVGRepo_tracerCarrier"
          stroke-linecap="round"
          stroke-linejoin="round"
        ></g>
        <g id="SVGRepo_iconCarrier">
          {' '}
          <path
            d="M16.1924 5.65683C16.5829 5.2663 16.5829 4.63314 16.1924 4.24261L13.364 1.41419C12.5829 0.633139 11.3166 0.633137 10.5355 1.41419L7.70711 4.24261C7.31658 4.63314 7.31658 5.2663 7.70711 5.65683C8.09763 6.04735 8.73079 6.04735 9.12132 5.65683L11 3.77812V11.0503H3.72784L5.60655 9.17157C5.99707 8.78104 5.99707 8.14788 5.60655 7.75735C5.21602 7.36683 4.58286 7.36683 4.19234 7.75735L1.36391 10.5858C0.582863 11.3668 0.582859 12.6332 1.36391 13.4142L4.19234 16.2426C4.58286 16.6332 5.21603 16.6332 5.60655 16.2426C5.99707 15.8521 5.99707 15.219 5.60655 14.8284L3.8284 13.0503H11V20.2219L9.12132 18.3432C8.73079 17.9526 8.09763 17.9526 7.7071 18.3432C7.31658 18.7337 7.31658 19.3669 7.7071 19.7574L10.5355 22.5858C11.3166 23.3669 12.5829 23.3669 13.364 22.5858L16.1924 19.7574C16.5829 19.3669 16.5829 18.7337 16.1924 18.3432C15.8019 17.9526 15.1687 17.9526 14.7782 18.3432L13 20.1213V13.0503H20.071L18.2929 14.8284C17.9024 15.219 17.9024 15.8521 18.2929 16.2426C18.6834 16.6332 19.3166 16.6332 19.7071 16.2426L22.5355 13.4142C23.3166 12.6332 23.3166 11.3668 22.5355 10.5858L19.7071 7.75735C19.3166 7.36683 18.6834 7.36683 18.2929 7.75735C17.9024 8.14788 17.9024 8.78104 18.2929 9.17157L20.1716 11.0503H13V3.87867L14.7782 5.65683C15.1687 6.04735 15.8019 6.04735 16.1924 5.65683Z"
            fill="#fff"
          ></path>{' '}
        </g>
      </svg>
      Drag to move
    </div>
  );
}