import {useEffect, useRef} from 'react';
import {useLocation, useNavigationType} from '@remix-run/react';

function InstantScrollRestoration() {
  const positions = useRef({});
  const location = useLocation();
  const navType = useNavigationType(); // 'POP', 'PUSH' or 'REPLACE'

  // Save position before navigating away
  useEffect(() => {
    return () => {
      const el = document.scrollingElement || document.documentElement;
      positions.current[location.key] = el.scrollTop;
    };
  }, [location]);

  // Restore on navigation
  useEffect(() => {
    const el = document.scrollingElement || document.documentElement;
    const y = positions.current[location.key];
    if (navType === 'POP' && y != null) {
      el.scrollTo({top: y, behavior: 'instant'});
    } else {
      el.scrollTo({top: 0, behavior: 'instant'});
    }
  }, [location, navType]);

  return null;
}

export default InstantScrollRestoration;
