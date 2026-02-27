import * as React from 'react';
import {Pagination} from '@shopify/hydrogen';
import '../styles/Pagination.css';

export function PaginatedResourceSection({
  connection,
  children,
  resourcesClassName,
}) {
  const observerRef = React.useRef(null);
  const containerRef = React.useRef(null);
  const autoLoadLockRef = React.useRef(false);

  React.useEffect(() => {
    autoLoadLockRef.current = false;
  }, [connection.pageInfo.endCursor]);

  React.useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    const root = containerRef.current;
    if (!root) return undefined;

    const nextLinkElement = root.querySelector('[data-next-link="true"]');
    if (!nextLinkElement) return undefined;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry.isIntersecting) return;
        if (autoLoadLockRef.current) return;
        if (entry.target.getAttribute('aria-disabled') === 'true') return;

        autoLoadLockRef.current = true;
        entry.target.click(); // Trigger click on `NextLink`
      },
      {threshold: 0.25, rootMargin: '200px 0px'},
    );

    observerRef.current.observe(nextLinkElement);

    return () => observerRef.current.disconnect();
  }, [connection.pageInfo.endCursor]); // Re-run when the page changes

  return (
    <Pagination connection={connection}>
      {({nodes, isLoading, PreviousLink, NextLink}) => {
        const resourcesMarkup = nodes.map((node, index) =>
          children({node, index}),
        );

        return (
          <div className="w-[99%]" ref={containerRef}>
            <div className="pagination-buttons">
              <PreviousLink className="pagination-button">
                {isLoading ? 'Loading...' : <span>↑ Load previous</span>}
              </PreviousLink>
            </div>
            {resourcesClassName ? (
              <div className={resourcesClassName}>{resourcesMarkup}</div>
            ) : (
              resourcesMarkup
            )}
            <div className="pagination-buttons">
              <NextLink
                className="pagination-button next-link"
                data-next-link="true"
              >
                {isLoading ? 'Loading...' : <span>Load more ↓</span>}
              </NextLink>
            </div>
          </div>
        );
      }}
    </Pagination>
  );
}
