import {useRouteLoaderData} from '@remix-run/react';
import {useEffect, useState} from 'react';
import {collectBrowserCartTracking} from '~/lib/browserCartTracking';
import {CHECKOUT_TRACKING_ATTRIBUTE_KEYS} from '~/lib/trackingKeys';

export function CartTrackingFields() {
  const rootData = useRouteLoaderData('root');
  const [fields, setFields] = useState(() =>
    collectBrowserCartTracking(rootData),
  );

  useEffect(() => {
    setFields(collectBrowserCartTracking(rootData));
  }, [rootData]);

  useEffect(() => {
    if (fields.wtp) return undefined;

    let attempts = 0;
    const interval = window.setInterval(() => {
      attempts += 1;
      const nextFields = collectBrowserCartTracking(rootData);
      setFields(nextFields);

      if (nextFields.wtp || attempts >= 20) {
        window.clearInterval(interval);
      }
    }, 500);

    return () => window.clearInterval(interval);
  }, [fields.wtp, rootData]);

  return (
    <>
      {CHECKOUT_TRACKING_ATTRIBUTE_KEYS.map((key) => (
        <input key={key} type="hidden" name={key} value={fields[key] || ''} />
      ))}
    </>
  );
}
