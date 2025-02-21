import React, {useState, useEffect} from 'react';

const MobileAppPopup = () => {
  const [showPopup, setShowPopup] = useState(false);

  // Check if the user agent is mobile
  const isMobileDevice = () => /Mobi|Android/i.test(navigator.userAgent);

  useEffect(() => {
    if (isMobileDevice()) {
      const timer = setTimeout(() => {
        setShowPopup(true);
        // Optionally disable scrolling when popup is open
        document.body.style.overflow = 'hidden';
        document.body.style.height = '100%';
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const closePopup = () => {
    setShowPopup(false);
    // Restore scrolling
    document.body.style.overflow = '';
    document.body.style.height = '';
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
      {/* Overlay */}
      <div
        id="app-popup-overlay"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 999,
        }}
        onClick={closePopup}
      />
      {/* Popup Container */}
      <div
        className="appPopupContainer"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1000,
          backgroundColor: '#fff',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center',
          boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
        }}
      >
        <button
          onClick={closePopup}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
          }}
          aria-label="Close popup"
        >
          &times;
        </button>
        <div id="popup-content">
          <img
            src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/961souqLogo_Cart_19e9e372-5859-44c9-8915-11b81ed78213.png?v=1719486376"
            alt="App Image"
            width="50"
            height="50"
          />
          <hr style={{border: '1px solid grey', width: '100%'}} />
          <p style={{fontSize: '14px', fontWeight: '500'}}>
            Try our New and Updated <br /> Mobile APP!
          </p>
          <button
            onClick={handleDownloadClick}
            style={{
              padding: '12px 25px',
              backgroundColor: '#2172af',
              color: '#fff',
              borderRadius: '5px',
              border: 'none',
              boxShadow: '-2px 3px 3px 0px #dadada',
              cursor: 'pointer',
            }}
          >
            DOWNLOAD
          </button>
        </div>
      </div>
    </>
  );
};

export default MobileAppPopup;
