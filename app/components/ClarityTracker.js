// ClarityTracker.js
import React, {useEffect} from 'react';
import {clarity} from 'react-microsoft-clarity';

// module‐scope flag prevents any double‐init
let didInitClarity = false;

const ClarityTracker = ({clarityId, userId, userProperties}) => {
  useEffect(() => {
    // 1) bail if no ID or already initialized
    if (!clarityId || didInitClarity) return;

    // 2) init & consent
    clarity.init(clarityId);
    clarity.consent();

    // 3) optionally identify the user
    if (userId) {
      clarity.identify(userId, userProperties);
    }

    // 4) start tracking
    clarity.start();

    // mark as done
    didInitClarity = true;

    // cleanup on unmount
    return () => {
      clarity.stop();
    };
  }, [clarityId]); // only re-runs if clarityId itself changes

  return null;
};

export default ClarityTracker;
