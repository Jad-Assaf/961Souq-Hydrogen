import {Link} from '@remix-run/react';
import '../styles/apple-virtual-showroom.css';
import {useState, useEffect, useRef, useMemo} from 'react';

// Manually define your product data with fixed positions
const products = [
  {
    id: '1',
    title: 'Samsung 49" Odyssey OLED G9 (G95SC) Dual QHD Curved Gaming Monitor',
    handle: 'samsung-49-odyssey-oled-g9-g95sc-dual-qhd-curved-gaming-monitor',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Samsung-49_-Odyssey-OLED-G9-_G95SC_-4.jpg?v=1729343777',
    },
    position: {x: 160, y: 665},
  },
  {
    id: '2',
    title: 'Samsung 49" Odyssey Neo G9 - DQHD 240Hz Curved Gaming Monitor',
    handle:
      'samsung-49-odyssey-neo-g9-dqhd-240hz-curved-gaming-monitor-1msgtg-g-sync-compatible-quantum-hdr2000-ls49ag950npxen',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/DQHD-Monitor-With-Quantum-Mini-LED-LS49AG950NMXZN_08d4da8c-3291-415b-9371-bb1017ce9077.jpg?v=1716805157',
    },
    position: {x: 570, y: 520},
  },
  {
    id: '3',
    title: 'Samsung 34" Odyssey OLED G8 Ultra WQHD 175Hz Gaming Monitor',
    handle:
      'samsung-34-odyssey-oled-g8-wqhd-175mhz-gming-monitor-g85sb-ls34bg850suxxu',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/34_-Odyssey-OLED-G8-G85SB-LS34BG850SMXUE.jpg?v=1705924931',
    },
    position: {x: 935, y: 395},
  },
  {
    id: '4',
    title: 'Samsung QLED 4K Q70C Smart TV',
    handle: 'samsung-qled-4k-q70c-smart-tv',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/QLED4KQ70CSmartTV.jpg?v=1697012176',
    },
    position: {x: 1395, y: 375},
  },
  {
    id: '5',
    title: 'Samsung 65″ The Frame QLED 4K Smart QLED TV',
    handle: 'samsung-65-the-frame-qled-4k-smart-qled-tv-ls03b',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/QA65LS03BAUXTW_c34c8ee2-cb96-462e-ba6a-71098830aee2.jpg?v=1696945307',
    },
    position: {x: 1705, y: 495},
  },
  {
    id: '6',
    title:
      'Samsung Q930C Soundbar – Immersive 3D Audio with Wireless Dolby Atmos',
    handle: 'samsung-q930c-soundbar',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Q930C_9b3ffcfe-3fbf-4f3b-8fd3-2a2e557a4deb.jpg?v=1743513633',
    },
    position: {x: 1685, y: 545},
  },
  {
    id: '7',
    title: 'Samsung Flip 2 85" Digital Flipchart - 4K UHD Touch Screen',
    handle:
      'samsung-flip-2-wm85r-85-inch-digital-flipchart-for-business-4k-uhd-3840x2160-with-touch-screen',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/products/2_9cf7615e-fb85-45e1-b819-b4bb1661130c.jpg?v=1666184541',
    },
    position: {x: 2075, y: 600},
  },
  {
    id: '8',
    title: 'Samsung Galaxy Tab A9',
    handle: 'samsung-galaxy-tab-a9',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/samsung-galaxy-tab-a9.jpg?v=1708610760',
    },
    position: {x: 470, y: 760},
  },
  {
    id: '9',
    title: 'Samsung Galaxy Tab A9+',
    handle: 'samsung-galaxy-tab-a9-plus',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/galaxy-tab-a9-plus.jpg?v=1701181606',
    },
    position: {x: 540, y: 730},
  },
  {
    id: '10',
    title: 'Samsung Galaxy Tab S10+',
    handle:
      'samsung-galaxy-tab-s10-12gb-ram-256gb-storage-wi-fi-moonstone-grey',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Samsung-240676423-au-galaxy-tab-s10-plus-sm-x820-523193-sm-x826bzaaats-543559733--Download-Sour-zoom.webp?v=1743838509',
    },
    position: {x: 685, y: 672},
  },
  {
    id: '11',
    title: 'Samsung Galaxy Tab S8 Ultra',
    handle: 'samsung-galaxy-tab-s8-ultra-wifi-12gb-ram-256gb-storage-open-box',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/products/541.jpg?v=1672391750',
    },
    position: {x: 880, y: 600},
  },
  {
    id: '12',
    title: 'Samsung Galaxy Tab S9 Ultra',
    handle: 'samsung-galaxy-tab-s9-ultra-14-6-inch-graphite',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Samsung-Galaxy-Tab-S9-Ultra_9021469e-72fe-4240-98ee-827365821b6a.jpg?v=1693984959',
    },
    position: {x: 968, y: 565},
  },
  {
    id: '13',
    title: 'Samsung Galaxy Tab S10 Ultra',
    handle: 'samsung-galaxy-tab-s10-ultra-wifi-12gb-ram',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Galaxy-Tab-S10-series_d6b5f100-7820-4751-8bb2-a5178805a069.jpg?v=1731324325',
    },
    position: {x: 1060, y: 530},
  },
  {
    id: '14',
    title: 'Samsung Galaxy S24 Ultra',
    handle: 'samsung-galaxy-s24-ultra',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Samsung-Galaxy-S24-Ultra-Titanium-Black_08a47853-d82b-437d-b14f-ac0e727d284f.jpg?v=1705665665',
    },
    position: {x: 1268, y: 515},
  },
  {
    id: '15',
    title: 'Samsung Galaxy S25 Ultra',
    handle: 'samsung-galaxy-s25-ultra-1tb',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Galaxy-S25-Ultra-27.jpg?v=1737627777',
    },
    position: {x: 1308, y: 535},
  },
  {
    id: '16',
    title: 'Samsung Galaxy Z Flip6',
    handle: 'samsung-galaxy-z-flip-6-12gb-ram-512gb-storage',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/samsung-flip-6-Yellow-3.jpg?v=1721737695',
    },
    position: {x: 1355, y: 557},
  },
  {
    id: '17',
    title: 'Samsung Galaxy Z Fold6',
    handle: 'samsung-galaxy-z-fold-6-12gb-ram-256-512gb-storage',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Samsung-Galaxy-Z-Fold6.jpg?v=1721740082',
    },
    position: {x: 1430, y: 570},
  },
  {
    id: '18',
    title: 'Samsung Galaxy Watch7',
    handle: 'samsung-galaxy-watch7',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/samsung-galaxy-watch-7.jpg?v=1721724215',
    },
    position: {x: 1568, y: 660},
  },
  {
    id: '19',
    title: 'Samsung Galaxy Buds2 Pro',
    handle: 'samsung-galaxy-buds-2-pro',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/products/222_64c0cd4e-4760-4df8-a035-5535d1d96dec.jpg?v=1673600586',
    },
    position: {x: 1608, y: 680},
  },
  {
    id: '20',
    title: 'Samsung Galaxy Buds3 Pro',
    handle: 'samsung-galaxy-buds3-pro',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Samsung-Galaxy-Buds3-Pro.jpg?v=1720182371',
    },
    position: {x: 1648, y: 698},
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
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/samsung-new_245f2596-cee1-4eec-a321-34356394fcc9.jpg?v=1746170577&quality=10';
  const highQualityUrl =
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/samsung-new_245f2596-cee1-4eec-a321-34356394fcc9.jpg?v=1746170577&quality=100';
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
      <SamsungMarker position={{ x: 2100, y: 413 }} />
      <PrevMarker position={{ x: 155, y: 368 }} />
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
        className="pulsating-circle"
        style={{'--delay': `-${randomDelay}s`}}
      ></div>
      <a href='/home-appliances-showroom' className="home-tooltip">Home Appliances</a>
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
      <a href='/apple-virtual-showroom' className="home-tooltip">Apple Showroom</a>
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

