import * as React from 'react';
import { Pagination } from '@shopify/hydrogen';

export function PaginatedResourceSection({
  connection,
  children,
  resourcesClassName,
}) {
  return (
    <Pagination connection={connection}>
      {({ nodes, isLoading, PreviousLink, NextLink, resetPagination }) => {
        const resourcesMarkup = nodes.map((node, index) =>
          children({ node, index })
        );

        return (
          <div>
            {resourcesClassName ? (
              <div className={resourcesClassName}>{resourcesMarkup}</div>
            ) : (
              resourcesMarkup
            )}
            <div>
              {!isLoading && (
                <>
                  <PreviousLink onClick={() => resetPagination(true)}>
                    <span>Load previous</span>
                  </PreviousLink>
                  <NextLink onClick={() => resetPagination(false)}>
                    <span>Load more ↓</span>
                  </NextLink>
                </>
              )}
            </div>
          </div>
        );
      }}
    </Pagination>
  );
}
