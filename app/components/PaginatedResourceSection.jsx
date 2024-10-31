import * as React from 'react';
import { Pagination } from '@shopify/hydrogen';

export function PaginatedResourceSection({
  connection,
  children,
  resourcesClassName,
}) {
  const observerRef = React.useRef(null);

  // Observe the NextLink for automatic fetching
  React.useEffect(() => {
    if (!observerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && observerRef.current) {
          observerRef.current.click(); // Trigger NextLink click
        }
      },
      { threshold: 1.0 }
    );

    if (observerRef.current) observer.observe(observerRef.current);

    return () => {
      if (observerRef.current) observer.unobserve(observerRef.current);
    };
  }, []);

  return (
    <Pagination connection={connection}>
      {({ nodes, isLoading, PreviousLink, NextLink }) => {
        const resourcesMarkup = nodes.map((node, index) =>
          children({ node, index })
        );

        return (
          <div>
            <PreviousLink>
              {isLoading ? 'Loading...' : <span>↑ Load previous</span>}
            </PreviousLink>

            {resourcesClassName ? (
              <div className={resourcesClassName}>{resourcesMarkup}</div>
            ) : (
              resourcesMarkup
            )}

            <NextLink>
              {isLoading ? (
                'Loading...'
              ) : (
                <span ref={observerRef}>Load more ↓</span>
              )}
            </NextLink>
          </div>
        );
      }}
    </Pagination>
  );
}
