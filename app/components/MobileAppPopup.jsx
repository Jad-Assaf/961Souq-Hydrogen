import React, {useState, useEffect} from 'react';
import '../styles/MobileAppPopup.css';

const MobileAppPopup = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [popupClass, setPopupClass] = useState('hide');
  const [overlayClass, setOverlayClass] = useState('hide');

  // Function to detect mobile devices
  const isMobileDevice = () => /Mobi|Android/i.test(navigator.userAgent);

  useEffect(() => {
    if (isMobileDevice()) {
      const timer = setTimeout(() => {
        setShowPopup(true);
        // Trigger the CSS animations by adding the "show" classes
        setOverlayClass('show');
        setPopupClass('show');
        // Disable body scroll while popup is visible
        document.body.style.overflow = 'hidden';
        document.body.style.height = '100%';
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const closePopup = () => {
    // Start fade-out and scale-down animations by switching to "hide" classes
    setOverlayClass('hide');
    setPopupClass('hide');
    // After animation (0.5s), remove the popup from view and restore scrolling
    setTimeout(() => {
      setShowPopup(false);
      document.body.style.overflow = '';
      document.body.style.height = '';
    }, 500);
  };

  const handleDownloadClick = () => {
    let appLink = '';
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
      appLink = 'https://apps.apple.com/lb/app/souq-961/id6504404642';
    } else if (/android/i.test(userAgent)) {
      appLink =
        'https://play.google.com/store/apps/details?id=com.souq961.app&pcampaignid=web_share';
    }
    if (appLink) {
      window.open(appLink, '_blank');
    }
  };

  if (!showPopup) return null;

  return (
    <>
      <div
        id="app-popup-overlay"
        className={overlayClass}
        onClick={closePopup}
      ></div>
      <div className="appPopupContainer">
        <div
          id="app-popup"
          className={popupClass}
          onClick={(e) => e.stopPropagation()} // Prevent click events from bubbling to overlay
        >
          <button
            id="close-popup"
            onClick={closePopup}
            aria-label="Close Popup"
          >
            &times;
          </button>
          <div id="popup-content">
            <img
              src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/961souqLogo_Cart_19e9e372-5859-44c9-8915-11b81ed78213.png?v=1719486376"
              alt="App Image"
            />
            <hr style={{border: '1px solid #2172af', width: '75%'}} />
            <p style={{fontSize: '16px', fontWeight: '300'}}>
              Try our New and Updated <br /> Mobile APP!
            </p>
            <button id="download-button" onClick={handleDownloadClick}>
              DOWNLOAD
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileAppPopup;
