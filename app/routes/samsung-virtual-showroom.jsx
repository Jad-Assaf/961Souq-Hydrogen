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
    position: {x: 170, y: 670},
  },
  {
    id: '2',
    title: 'Samsung 49" Odyssey Neo G9 - DQHD 240Hz Curved Gaming Monitor',
    handle:
      'samsung-49-odyssey-neo-g9-dqhd-240hz-curved-gaming-monitor-1msgtg-g-sync-compatible-quantum-hdr2000-ls49ag950npxen',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/DQHD-Monitor-With-Quantum-Mini-LED-LS49AG950NMXZN_08d4da8c-3291-415b-9371-bb1017ce9077.jpg?v=1716805157',
    },
    position: {x: 585, y: 525},
  },
  {
    id: '3',
    title: 'Samsung 34" Odyssey OLED G8 Ultra WQHD 175Hz Gaming Monitor',
    handle:
      'samsung-34-odyssey-oled-g8-wqhd-175mhz-gming-monitor-g85sb-ls34bg850suxxu',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/34_-Odyssey-OLED-G8-G85SB-LS34BG850SMXUE.jpg?v=1705924931',
    },
    position: {x: 945, y: 400},
  },
  {
    id: '4',
    title: 'Samsung QLED 4K Q70C Smart TV',
    handle: 'samsung-qled-4k-q70c-smart-tv',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/QLED4KQ70CSmartTV.jpg?v=1697012176',
    },
    position: {x: 1400, y: 375},
  },
  {
    id: '5',
    title: 'Samsung 65″ The Frame QLED 4K Smart QLED TV',
    handle: 'samsung-65-the-frame-qled-4k-smart-qled-tv-ls03b',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/QA65LS03BAUXTW_c34c8ee2-cb96-462e-ba6a-71098830aee2.jpg?v=1696945307',
    },
    position: {x: 1705, y: 475},
  },
  {
    id: '6',
    title:
      'Samsung Q930C Soundbar – Immersive 3D Audio with Wireless Dolby Atmos',
    handle: 'samsung-q930c-soundbar',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Q930C_9b3ffcfe-3fbf-4f3b-8fd3-2a2e557a4deb.jpg?v=1743513633',
    },
    position: {x: 1685, y: 535},
  },
  {
    id: '7',
    title: 'Samsung Flip 2 85" Digital Flipchart - 4K UHD Touch Screen',
    handle:
      'samsung-flip-2-wm85r-85-inch-digital-flipchart-for-business-4k-uhd-3840x2160-with-touch-screen',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/products/2_9cf7615e-fb85-45e1-b819-b4bb1661130c.jpg?v=1666184541',
    },
    position: {x: 2070, y: 600},
  },
  {
    id: '8',
    title: 'Samsung Galaxy Tab A9',
    handle: 'samsung-galaxy-tab-a9',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/samsung-galaxy-tab-a9.jpg?v=1708610760',
    },
    position: {x: 475, y: 750},
  },
  {
    id: '9',
    title: 'Samsung Galaxy Tab A9+',
    handle: 'samsung-galaxy-tab-a9-plus',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/galaxy-tab-a9-plus.jpg?v=1701181606',
    },
    position: {x: 545, y: 720},
  },
  {
    id: '10',
    title: 'Samsung Galaxy Tab S10+',
    handle:
      'samsung-galaxy-tab-s10-12gb-ram-256gb-storage-wi-fi-moonstone-grey',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Samsung-240676423-au-galaxy-tab-s10-plus-sm-x820-523193-sm-x826bzaaats-543559733--Download-Sour-zoom.webp?v=1743838509',
    },
    position: {x: 690, y: 660},
  },
  {
    id: '11',
    title: 'Samsung Galaxy Tab S8 Ultra',
    handle: 'samsung-galaxy-tab-s8-ultra-wifi-12gb-ram-256gb-storage-open-box',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/products/541.jpg?v=1672391750',
    },
    position: {x: 882, y: 590},
  },
  {
    id: '12',
    title: 'Samsung Galaxy Tab S9 Ultra',
    handle: 'samsung-galaxy-tab-s9-ultra-14-6-inch-graphite',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Samsung-Galaxy-Tab-S9-Ultra_9021469e-72fe-4240-98ee-827365821b6a.jpg?v=1693984959',
    },
    position: {x: 970, y: 555},
  },
  {
    id: '13',
    title: 'Samsung Galaxy Tab S10 Ultra',
    handle: 'samsung-galaxy-tab-s10-ultra-wifi-12gb-ram',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Galaxy-Tab-S10-series_d6b5f100-7820-4751-8bb2-a5178805a069.jpg?v=1731324325',
    },
    position: {x: 1065, y: 518},
  },
  {
    id: '14',
    title: 'Samsung Galaxy S24 Ultra',
    handle: 'samsung-galaxy-s24-ultra',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Samsung-Galaxy-S24-Ultra-Titanium-Black_08a47853-d82b-437d-b14f-ac0e727d284f.jpg?v=1705665665',
    },
    position: {x: 1268, y: 505},
  },
  {
    id: '15',
    title: 'Samsung Galaxy S25 Ultra',
    handle: 'samsung-galaxy-s25-ultra-1tb',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Galaxy-S25-Ultra-27.jpg?v=1737627777',
    },
    position: {x: 1308, y: 525},
  },
  {
    id: '16',
    title: 'Samsung Galaxy Z Flip6',
    handle: 'samsung-galaxy-z-flip-6-12gb-ram-512gb-storage',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/samsung-flip-6-Yellow-3.jpg?v=1721737695',
    },
    position: {x: 1355, y: 547},
  },
  {
    id: '17',
    title: 'Samsung Galaxy Z Fold6',
    handle: 'samsung-galaxy-z-fold-6-12gb-ram-256-512gb-storage',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Samsung-Galaxy-Z-Fold6.jpg?v=1721740082',
    },
    position: {x: 1430, y: 565},
  },
  {
    id: '18',
    title: 'Samsung Galaxy Watch7',
    handle: 'samsung-galaxy-watch7',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/samsung-galaxy-watch-7.jpg?v=1721724215',
    },
    position: {x: 1585, y: 655},
  },
  {
    id: '19',
    title: 'Samsung Galaxy Buds2 Pro',
    handle: 'samsung-galaxy-buds-2-pro',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/products/222_64c0cd4e-4760-4df8-a035-5535d1d96dec.jpg?v=1673600586',
    },
    position: {x: 1650, y: 685},
  },
  {
    id: '20',
    title: 'Samsung Galaxy Buds3 Pro',
    handle: 'samsung-galaxy-buds3-pro',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Samsung-Galaxy-Buds3-Pro.jpg?v=1720182371',
    },
    position: {x: 1715, y: 715},
  },
  {
    id: '21',
    title: 'Samsung Galaxy SmartTag2',
    handle: 'samsung-galaxy-smarttag2-black-1-pack-ei-t5600bbegww',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Samsung-Galaxy-SmartTag2-5.jpg?v=1696666187',
    },
    position: {x: 1772, y: 745},
  },
];

export default function ProductsImage() {
  return (
    <div className="showroom-container">
      <nav className="vr-header">
        <div className="vr-header__logo">
          <a href="/">
            <img
              src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/961souqLogo-1_2.png?v=1709718912"
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
  // useEffect(() => {
  //   function scrollToCustomPosition() {
  //     const container = containerRef.current;
  //     if (container && window.innerWidth < 768) {
  //       container.scrollTo({
  //         left: 300,
  //         top: 0,
  //         behavior: 'smooth',
  //       });
  //     }
  //   }
  //   setTimeout(scrollToCustomPosition, 200);
  // }, []);

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
      <SamsungMarker position={{x: 2100, y: 405}} />
      <PrevMarker position={{x: 162, y: 358}} />
      <DeviceImage
        src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/erdtree-elden-ring.gif?v=1746266938&quality=50"
        className="screen-1 inverted-radius"
      />
      <DeviceImage
        src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/INT9_PC_Valhalla-Combat-Montage-SHORT_Legal-ESRB-ezgif.com-resize.gif?v=1746273272&quality=50"
        className="screen-2 inverted-radius-2"
      />
      <DeviceImage
        src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/jett-valorant.gif?v=1746274237&quality=50"
        className="screen-3 inverted-radius-3"
      />
      <DeviceImage
        src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/NEO-QLED-Picture-Quality_main3.gif?v=1746275291&quality=30"
        className="screen-4"
      />
      <DeviceImage
        src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/topic_meet-the-frame-a-tv-designed-for-your-space_1_1_2_3.gif?v=1746276653&quality=30"
        className="screen-5"
      />
      {/* <DeviceImage
        src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/c221c756f2de42381c8b068a97cd6184.gif?v=1746277690&quality=30"
        className="screen-6"
      /> */}
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

    // hide on first drag/scroll/touchmove
    const handleHide = () => {
      setVisible(false);
      cleanup();
    };

    // auto-hide after 50s
    const timeout = setTimeout(() => setVisible(false), 50000);

    function cleanup() {
      container.removeEventListener('mousedown', handleHide);
      container.removeEventListener('scroll', handleHide);
      container.removeEventListener('touchmove', handleHide);
      clearTimeout(timeout);
    }

    container.addEventListener('mousedown', handleHide);
    container.addEventListener('scroll', handleHide);
    container.addEventListener('touchmove', handleHide);

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
        backdropFilter: 'blur(10px)',
      }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        stroke="transparent"
        style={{width: '30px', height: '30px'}}
      >
        <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
        <g
          id="SVGRepo_tracerCarrier"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></g>
        <g id="SVGRepo_iconCarrier">
          <path
            d="M16.1924 5.65683C16.5829 5.2663 16.5829 4.63314 16.1924 4.24261L13.364 1.41419C12.5829 0.633139 11.3166 0.633137 10.5355 1.41419L7.70711 4.24261C7.31658 4.63314 7.31658 5.2663 7.70711 5.65683C8.09763 6.04735 8.73079 6.04735 9.12132 5.65683L11 3.77812V11.0503H3.72784L5.60655 9.17157C5.99707 8.78104 5.99707 8.14788 5.60655 7.75735C5.21602 7.36683 4.58286 7.36683 4.19234 7.75735L1.36391 10.5858C0.582863 11.3668 0.582859 12.6332 1.36391 13.4142L4.19234 16.2426C4.58286 16.6332 5.21603 16.6332 5.60655 16.2426C5.99707 15.8521 5.99707 15.219 5.60655 14.8284L3.8284 13.0503H11V20.2219L9.12132 18.3432C8.73079 17.9526 8.09763 17.9526 7.70710 18.3432C7.31658 18.7337 7.31658 19.3669 7.70710 19.7574L10.5355 22.5858C11.3166 23.3669 12.5829 23.3669 13.364 22.5858L16.1924 19.7574C16.5829 19.3669 16.5829 18.7337 16.1924 18.3432C15.8019 17.9526 15.1687 17.9526 14.7782 18.3432L13 20.1213V13.0503H20.071L18.2929 14.8284C17.9024 15.219 17.9024 15.8521 18.2929 16.2426C18.6834 16.6332 19.3166 16.6332 19.70710 16.2426L22.5355 13.4142C23.3166 12.6332 23.3166 11.3668 22.5355 10.5858L19.7071 7.75735C19.3166 7.36683 18.6834 7.36683 18.2929 7.75735C17.9024 8.14788 17.9024 8.78104 18.2929 9.17157L20.1716 11.0503H13V3.87867L14.7782 5.65683C15.1687 6.04735 15.8019 6.04735 16.1924 5.65683Z"
            fill="#fff"
          />
        </g>
      </svg>
      Drag to move
    </div>
  );
}

const DeviceImage = ({src, className, zIndex}) => {
  const [isHighQualityLoaded, setIsHighQualityLoaded] = useState(false);

  useEffect(() => {
    const baseImg = document.getElementById('base-image');
    if (!baseImg) return;

    // if it’s already loaded
    if (baseImg.complete && baseImg.naturalWidth !== 0) {
      setIsHighQualityLoaded(true);
      return;
    }

    // otherwise listen for its load
    const onLoad = () => setIsHighQualityLoaded(true);
    baseImg.addEventListener('load', onLoad);
    return () => baseImg.removeEventListener('load', onLoad);
  }, []);

  return (
    <img
      src={src}
      alt=""
      className={`device-common ${className || ''} ${
        !isHighQualityLoaded ? 'blur' : ''
      }`}
      style={zIndex != null ? {zIndex} : undefined}
    />
  );
};
