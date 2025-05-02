import {Link} from '@remix-run/react';
import '../styles/apple-virtual-showroom.css';
import {useState, useEffect, useRef, useMemo} from 'react';

// Manually define your product data with fixed positions
const products = [
  {
    id: '1',
    title: 'Dyson Purifier Hot+Cool™ Gen1',
    handle:
      'products/dyson-purifier-hot-cool-gen1-machine-purifying-fan-heater',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Dyson-Purifier-Hot_Cool-Gen1-machine-purifying-fan-heater.jpg?v=1695195477',
    },
    position: {x: 105, y: 665},
  },
  {
    id: '2',
    title: 'Dyson Purifier Cool Formaldehyde™ TP09',
    handle:
      'products/dyson-purifier-cool-formaldehyde-tp09-purifying-fan-white-gold',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/DysonPurifierCoolFormaldehyde_TP09purifyingfan_White_Gold.jpg?v=1690444097',
    },
    position: {x: 263, y: 565},
  },
  {
    id: '3',
    title: 'Dyson TP03 Pure Cool Link Tower',
    handle: 'products/dyson-tp03-pure-cool-link-tower-white-silver',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/tp03.jpg?v=1690444115',
    },
    position: {x: 480, y: 495},
  },
  {
    id: '4',
    title: 'Dyson Purifier Humidify+Cool Formaldehyde PH04',
    handle:
      'products/dyson-purifier-humidify-cool-formaldehyde-ph04-white-gold',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Dyson-Purifier-Humidify_Cool-Formaldehyde_5098bba3-e27c-4b1e-93d6-2a36a90cd676.jpg?v=1708936893',
    },
    position: {x: 620, y: 450},
  },
  {
    id: '5',
    title: 'Xiaomi Smart Air Purifier Elite',
    handle: 'products/xiaomi-smart-air-purifier-elite',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Xiaomi-Smart-Air-Purifier-Elite-1.jpg?v=1729672158',
    },
    position: {x: 835, y: 390},
  },
  {
    id: '6',
    title: 'Xiaomi Robot Vacuum X20 Pro',
    handle: 'products/xiaomi-robot-vacuum-x20-pro',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Xiaomi-Robot-Vacuum-X20-Pro-3.jpg?v=1729512268',
    },
    position: {x: 905, y: 360},
  },
  {
    id: '7',
    title: 'All Vacuum Cleaners',
    handle: 'collections/robot-vacuum-cleaners',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/collections/Xiaomi-Robot-Vacuum-S10_-1.webp?v=1711807016',
    },
    position: {x: 1008, y: 378},
  },
  {
    id: '8',
    title: 'Coffee Makers',
    handle: 'collections/coffee-makers',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/L_Or-Barista-Sublime.jpg?v=1737130709',
    },
    position: {x: 1240, y: 355},
  },
  {
    id: '9',
    title: 'Blenders & Mixers',
    handle: 'collections/blenders',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/PD-LSBLGR-BK-3.jpg?v=1725376536',
    },
    position: {x: 1305, y: 385},
  },
  {
    id: '10',
    title: 'Kettles',
    handle: 'collections/kettles',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/LePresso-Smart-Electric-Kettle.jpg?v=1715692734',
    },
    position: {x: 1360, y: 408},
  },
  {
    id: '11',
    title: 'Air Fryers',
    handle: 'collections/air-fryer',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Xiaomi-Smart-Air-Fryer-6.5L-1.jpg?v=1720870023',
    },
    position: {x: 1410, y: 430},
  },
  {
    id: '12',
    title: 'Massagers',
    handle: 'collections/massagers',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/KiCAEvo1.jpg?v=1706101257',
    },
    position: {x: 1550, y: 500},
  },
  {
    id: '13',
    title: 'Scales',
    handle: 'collections/scales',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Eufy-Smart-Scale-P2-Pro.jpg?v=1738225915',
    },
    position: {x: 1628, y: 535},
  },
  {
    id: '14',
    title: 'Hair Trimmers',
    handle: 'collections/hair-trimmers',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/mg9553_a7877ed5-6eea-4b4b-9617-c620afb5710d.jpg?v=1737642836',
    },
    position: {x: 1720, y: 580},
  },
  {
    id: '15',
    title: 'LED Mirrors',
    handle: 'collections/mirrors',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/GNGLMAKE12WH.jpg?v=1729078234',
    },
    position: {x: 1885, y: 625},
  },
  {
    id: '16',
    title: 'Smart Speakers',
    handle: 'collections/smart-speakers',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Amazon-Echo-Studio-1.jpg?v=1737462952',
    },
    position: {x: 1950, y: 685},
  },
  {
    id: '17',
    title: 'Smart Doorbells',
    handle: 'collections/smart-doorbell',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/GA02076-US-6.jpg?v=1734696025',
    },
    position: {x: 1995, y: 710},
  },
  {
    id: '18',
    title: 'Smart Security Cameras',
    handle: 'collections/smart-security-cameras',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Stick-Up-Cam_ce4b9e15-2bf6-425d-b792-86a093125820.jpg?v=1739784920',
    },
    position: {x: 2045, y: 735},
  },
  {
    id: '19',
    title: 'Vacuum Cleaners',
    handle: 'collections/vacuum-cleaners',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Dyson-Gen5detect-2.jpg?v=1707577090',
    },
    position: {x: 580, y: 695},
  },
  {
    id: '20',
    title: 'Dyson Supersonic Hair Dryer - HD15',
    handle: 'products/dyson-supersonic-hair-dryer-hd15',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Dyson-Supersonic-Hair-Dryer-HD15-Onyx-Gold.jpg?v=1716386451',
    },
    position: {x: 823, y: 605},
  },
  {
    id: '21',
    title: 'Dyson Supersonic hair dryer Professional Edition Black/Nickel',
    handle:
      'products/dyson-supersonic-hair-dryer-professional-edition-black-nickel-free-supersonic-stand-fly-away-attachment',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Dyson-Supersonic_-hair-dryer-Professional-Edition-Black-Nickel-_-Free-Supersonic-Stand-_-Fly-Away-Attachment.jpg?v=1695132625',
    },
    position: {x: 907, y: 568},
  },
  {
    id: '22',
    title: 'Dyson Supersonic Hair Dryer HD07',
    handle: 'products/dyson-supersonic-hair-dryer-hd07',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Dyson-Supersonic-Hair-Dryer-HD07---Iron-Fuchsia.jpg?v=1708505074',
    },
    position: {x: 984, y: 535},
  },
  {
    id: '23',
    title: 'RGB LED Panels',
    handle: 'collections/rgb-led-panels',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/H6061.jpg?v=1706093616',
    },
    position: {x: 1270, y: 530},
  },
  {
    id: '24',
    title: 'RGB LED Light Bars',
    handle: 'collections/rgb-led-light-bars',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/JBL-PartyLight-Stick-5.jpg?v=1729004487',
    },
    position: {x: 1338, y: 565},
  },
  {
    id: '25',
    title: 'Razer Aether RGB Light Bars for PC',
    handle: 'products/razer-aether-rgb-light-bars',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/RZ43-05320100-R3EJ_c12a7340-b986-4eb3-9b2a-d24a83e9685c.jpg?v=1745416560',
    },
    position: {x: 1400, y: 590},
  },
  {
    id: '26',
    title: 'Amazon Echo Show 5',
    handle: 'products/amazon-echo-show-5-3rd-gen',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Amazon-Echo-Show-5-_3rd-Generation_-7.jpg?v=1735293947',
    },
    position: {x: 1530, y: 670},
  },
  {
    id: '27',
    title: 'Google Nest Hub Max',
    handle: 'products/google-nest-hub-max-smart-display-with-google-assistant',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Google--Nest-Hub-Max.jpg?v=1691222888',
    },
    position: {x: 1590, y: 700},
  },
  {
    id: '28',
    title: 'Amazon Echo Show 15',
    handle:
      'products/echo-show-15-full-hd-15-6-smart-display-with-alexa-and-fire-tv-built-in',
    featuredImage: {
      url: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Echo-Show-15.jpg?v=1703064168',
    },
    position: {x: 1680, y: 740},
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
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/home-new.jpg?v=1746170577&quality=10';
  const highQualityUrl =
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/home-new.jpg?v=1746170577&quality=100';
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
      <a href='/gaming-room' className="home-tooltip">Gaming Room</a>
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