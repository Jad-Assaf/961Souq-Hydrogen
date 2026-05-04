import React from 'react';
import {WorkerSearchBox} from '~/components/WorkerSearchBox';

export function TypesenseSearch({
  initialQuery = '',
  action = '/search',
  placeholder = 'Search products...',
  autoFocus = false,
}) {
  return (
    <WorkerSearchBox
      initialQuery={initialQuery}
      action={action}
      placeholder={placeholder}
      autoFocus={autoFocus}
    />
  );
}
