import {Link} from '@remix-run/react';
import '../styles/apple-virtual-showroom.css';
import {useState, useEffect, useRef, useMemo} from 'react';

// Manually define your product data with fixed positions
const products = [
  {
    id: '1',
    title: 'Nintendo Switch',
    handle: 'collections/nintendo-switch',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/products/nintendo-switch4_a2e8f9d1-6c8f-49ab-a63a-0a67a74c1712.jpg?v=1677159143',
    },
    position: {x: 365, y: 750},
  },
  {
    id: '2',
    title:
      'Sony DualSense Wireless Controller for PS5 – Monster Hunter Wilds Limited Edition',
    handle:
      'products/sony-dualsense-wireless-controller-for-ps5-monster-hunter-wilds-limited-edition',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/DualSense-Wireless-Controller---Monster-Hunter.jpg?v=1745924771',
    },
    position: {x: 480, y: 740},
  },
  {
    id: '3',
    title: 'PS5 Controllers',
    handle: 'collections/ps5-controllers',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/collections/controller5.webp?v=1711798050',
    },
    position: {x: 535, y: 720},
  },
  {
    id: '4',
    title: 'PS5 Consoles',
    handle: 'collections/sony-playstation',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Sony-PlayStation-5-Pro-Console-3.jpg?v=1730897478',
    },
    position: {x: 590, y: 650},
  },
  {
    id: '5',
    title: 'Console Games',
    handle: 'collections/console-games',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Assassins-Creed-Shadows.jpg?v=1742482335',
    },
    position: {x: 430, y: 875},
  },
  {
    id: '6',
    title:
      'Sony PS5 DualSense Wireless Controller – 30th Anniversary Limited Edition',
    handle:
      'products/sony-ps5-dualsense-wireless-controller-30th-anniversary-limited-edition',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/ps5-controller_1c77ee81-38e0-441d-ab1f-7c927c1a6b33.jpg?v=1732187946',
    },
    position: {x: 965, y: 1050},
  },
  {
    id: '7',
    title: 'RGB Light Bars',
    handle: 'collections/rgb-led-light-bars',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Govee-RGBICW-Smart-Corner-Floor-Lamp.jpg?v=1708163461',
    },
    position: {x: 1175, y: 650},
  },
  {
    id: '8',
    title: 'VR Headsets',
    handle: 'collections/vr-headsets',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Meta-quest-3-4_f405fb9c-daf0-4934-9129-6741227679da.jpg?v=1699697613',
    },
    position: {x: 1725, y: 180},
  },
  {
    id: '9',
    title: 'Valve Steam Deck',
    handle: 'products/valve-steam-deck',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/products/valve-steam-deck.jpg?v=1679735186',
    },
    position: {x: 1850, y: 330},
  },
  {
    id: '10',
    title: 'ROG Ally X',
    handle: 'products/rog-ally-x-2024-rc72la-handheld-gaming-console',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/rog-ally-x-9.jpg?v=1725033713',
    },
    position: {x: 2055, y: 385},
  },
  {
    id: '11',
    title: 'RGB Panels',
    handle: 'collections/rgb-led-panels',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/H6061.jpg?v=1706093616',
    },
    position: {x: 1600, y: 315},
  },
  {
    id: '12',
    title: 'Gaming Desktops',
    handle: 'collections/gaming-desktops',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/G16CHR.jpg?v=1737973936',
    },
    position: {x: 1490, y: 400},
  },
  {
    id: '13',
    title: 'Gaming Headphones',
    handle: 'collections/gaming-headphones',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Kraken-V4.jpg?v=1744885451',
    },
    position: {x: 1450, y: 580},
  },
  {
    id: '14',
    title: 'HyperX QuadCast 2 S',
    handle: 'products/hyperx-quadcast-2-s-advanced-usb-microphone',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/HyperX-QuadCast-2-S_5370e308-5bc4-451f-8d58-1582bbcf6b24.jpg?v=1737114174',
    },
    position: {x: 1560, y: 610},
  },
  {
    id: '15',
    title: 'Gaming Speakers',
    handle: 'collections/gaming-speakers',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Razer-Nommo.jpg?v=1683894112',
    },
    position: {x: 1630, y: 620},
  },
  {
    id: '16',
    title: 'Gaming Monitors',
    handle: 'collections/gaming-monitors',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/LS32CG552EMXUE_34c417c9-a4cb-4f75-864f-12ea0422acd4.jpg?v=1743511131',
    },
    position: {x: 1810, y: 550},
  },
  {
    id: '17',
    title: 'Gaming MousePads',
    handle: 'collections/mousepads',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/QcK-Prism-Cloth_dbc969d9-a891-4bc1-9211-fd532b70ea63.jpg?v=1744123558',
    },
    position: {x: 1630, y: 660},
  },
  {
    id: '18',
    title: 'Gaming Keyboards',
    handle: 'collections/gaming-keyboards',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/SteelSeries-Apex-Pro-Gen-3-Gaming-Keyboard.jpg?v=1744968070',
    },
    position: {x: 1730, y: 695},
  },
  {
    id: '19',
    title: 'Gaming Mouse',
    handle: 'collections/gaming-mouse',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Logitech-910-005568-G502-Lightspeed-Wireless-Gaming-Mouse.jpg?v=1691742889',
    },
    position: {x: 1835, y: 730},
  },
  {
    id: '20',
    title: 'Razer Aether RGB Light Bars',
    handle: 'products/razer-aether-rgb-light-bars',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/RZ43-05320100-R3EJ_c12a7340-b986-4eb3-9b2a-d24a83e9685c.jpg?v=1745416560',
    },
    position: {x: 2022, y: 745},
  },
  {
    id: '21',
    title: 'Gaming Chairs',
    handle: 'collections/gaming-chairs-desks',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Defensor-11.jpg?v=1738587890',
    },
    position: {x: 1900, y: 830},
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

function ProductImageWithMarkers({products}) {
  const lowQualityUrl =
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/gaming-3.jpg?v=1746000620&quality=10';
  const highQualityUrl =
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/gaming-3.jpg?v=1746000620&quality=100';
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
      <NextMarker position={{x: 2015, y: 458}} />
      <PrevMarker position={{x: 139, y: 425}} />
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

function NextMarker({position}) {
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
      <a href="/gaming-room" className="home-tooltip">
        Gaming Room
      </a>
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
        className="pulsating-circle"
        style={{'--delay': `-${randomDelay}s`}}
      ></div>
      <a href="/samsung-virtual-showroom" className="home-tooltip">
        Samsung Showroom
      </a>
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
            to={`/${product.handle}`}
            className="product-link"
            target="_blank"
          >
            <img
              src={product.featuredImage.url}
              alt={product.title}
              className="product-image"
            />
            <h3 className="product-title-v">{product.title}</h3>
            <span style={{padding: '3px 20px'}}>View</span>
          </Link>
        )}
      </div>
    </div>
  );
}
