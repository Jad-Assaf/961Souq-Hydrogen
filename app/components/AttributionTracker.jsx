import {useLocation, useRouteLoaderData} from '@remix-run/react';
import {useEffect} from 'react';
import {collectBrowserCartTracking} from '~/lib/browserCartTracking';

export function AttributionTracker() {
  const rootData = useRouteLoaderData('root');
  const location = useLocation();

  useEffect(() => {
    collectBrowserCartTracking(rootData);
  }, [rootData, location.pathname, location.search]);

  return null;
}
