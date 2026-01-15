// RespondIOWidget.jsx
import {useEffect} from 'react';
import {useNonce} from '@shopify/hydrogen';

// Module-scope flag prevents double initialization
let didInitRespondIO = false;

const RespondIOWidget = () => {
  const nonce = useNonce();

  useEffect(() => {
    // Bail if already initialized
    if (didInitRespondIO) return;

    // Check if script already exists
    if (document.getElementById('respondio__widget')) {
      didInitRespondIO = true;
      return;
    }

    // Create and inject the script
    const script = document.createElement('script');
    script.id = 'respondio__widget';
    script.src =
      'https://cdn.respond.io/webchat/widget/widget.js?cId=234b5a8193ec31661f3dbaa97fb8063';
    script.async = true;
    if (nonce) {
      script.setAttribute('nonce', nonce);
    }

    // Append to body
    document.body.appendChild(script);

    // Mark as initialized
    didInitRespondIO = true;

    // Cleanup on unmount (though this is unlikely in root layout)
    return () => {
      const existingScript = document.getElementById('respondio__widget');
      if (existingScript) {
        existingScript.remove();
        didInitRespondIO = false;
      }
    };
  }, [nonce]);

  return null;
};

export default RespondIOWidget;

