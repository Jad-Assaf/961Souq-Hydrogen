import React from 'react';
import { Link } from '@remix-run/react';
import { ProductRow } from './CollectionDisplay';
import { Image } from '@shopify/hydrogen-react';

const CollectionRows = ({ collections, menuCollections }) => {
  const filteredCollections = collections.filter(
    (collection) => collection.handle !== "new-arrivals" && collection.handle !== "laptops"
  );

  return (
    <>
      {filteredCollections.map((collection, index) => {
        const isMenuRow = index % 3 === 0;
        const menuIndex = Math.floor(index / 3);
        const currentMenu = Array.isArray(menuCollections)
          ? menuCollections[menuIndex]?.items || [] // Access menu items
          : [];

        return (
          <React.Fragment key={collection.id}>
            {/* Render the menu slider row */}
            {isMenuRow && currentMenu.length > 0 && (
              <div className="menu-slider-container">
                <div className="menu-category-slider">
                  {currentMenu.map((menuItem) => (
                    <Link
                      key={menuItem.id}
                      to={menuItem.url}
                      className="menu-item-container"
                    >
                      {menuItem.image && (
                        <Image
                          srcSet={`${menuItem.image.url}?width=300&quality=20 300w,
                                   ${menuItem.image.url}?width=600&quality=20 600w,
                                   ${menuItem.image.url}?width=1200&quality=20 1200w`}
                          alt={menuItem.image.altText || menuItem.title}
                          className="menu-item-image"
                          width={150}
                          height={150}
                        />
                      )}
                      <div className="category-title">{menuItem.title}</div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Render the product row */}
            <div className="collection-section">
              <div className="collection-header">
                <h3>{collection.title}</h3>
                <Link to={`/collections/${collection.handle}`} className="view-all-link">
                  View All
                </Link>
              </div>
              <ProductRow products={collection.products.nodes} />
            </div>
          </React.Fragment>
        );
      })}
    </>
  );
};

const LeftArrowIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
);

const RightArrowIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
);

export default CollectionRows;
