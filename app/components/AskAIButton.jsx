import React from 'react';
import ProductFAQ from './ProductFAQ';

export default function AskAIButton({productId, productFAQRef}) {
  return (
    <>
      <div className="ai-summary product-chat-launcher">
        <div className="ai-summary__header">
          <button
            type="button"
            className="ai-summary__action"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (productFAQRef?.current?.openChat) {
                productFAQRef.current.openChat();
              } else {
                console.warn('ProductFAQ ref not available', productFAQRef);
              }
            }}
          >
            Ask AI
          </button>
        </div>
      </div>
      {/* Render ProductFAQ outside the launcher so modal renders at root level */}
      <ProductFAQ
        ref={productFAQRef}
        productId={productId}
        hideLauncher={true}
      />
    </>
  );
}
