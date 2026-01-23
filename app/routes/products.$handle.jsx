import '../styles/ProductPage.css';
import React, { Suspense, useEffect, useRef, useState } from 'react';
import { redirect } from '@shopify/remix-oxygen';
import { Await, useLoaderData, useLocation } from '@remix-run/react';
import {
  getSelectedProductOptions,
  Analytics,
  useOptimisticVariant,
  Money,
  getSeoMeta,
  CartForm,
  VariantSelector,
} from '@shopify/hydrogen';
import { getVariantUrl } from '~/lib/variants';
import { ProductPrice } from '~/components/ProductPrice';
import { ProductImages } from '~/components/ProductImage'; // We'll update ProductImage.jsx to handle media.
import { AddToCartButton } from '~/components/AddToCartButton';
import { useAside } from '~/components/Aside';
import { CSSTransition } from 'react-transition-group';
import { RECOMMENDED_PRODUCTS_QUERY } from '~/lib/fragments';
import RelatedProductsRow from '~/components/RelatedProducts';
import { ProductMetafields } from '~/components/Metafields';
import RecentlyViewedProducts from '../components/RecentlyViewed';
import { trackAddToCart, trackViewContent } from '~/lib/metaPixelEvents';
import { trackAddToCartGA } from '~/lib/googleAnalyticsEvents';
import ProductFAQ from '~/components/ProductFAQ';
import WishlistButton from '~/components/WishlistButton';
import AskAIButton from '~/components/AskAIButton';

// ---------------- SEO & Meta
export const meta = ({ data }) => {
  const product = data?.product;
  const variants = product.variants || [];
  const currentVariant = variants[0] || {};

  // Helper to truncate title
  const truncate = (text, maxLength) =>
    text?.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;

  // Create the raw title
  const rawTitle = truncate(
    product?.seoTitle || product?.title || '961 Souq Product',
    140,
  );

  // Append " | Lebanon" if not already present (case-insensitive)
  const formattedTitle = rawTitle.toLowerCase().includes('lebanon')
    ? rawTitle
    : `${rawTitle} | Lebanon`;

  const rawImage = product.images?.edges?.[0]?.node?.url || '';
  let image = rawImage;

  // Check for protocol-relative URL
  if (rawImage.startsWith('//')) {
    image = `https:${rawImage}`;
  }
  // Check for relative path URL (starting with a single "/")
  else if (rawImage.startsWith('/')) {
    image = `https://cdn.shopify.com${rawImage}`;
  }

  // Fallback if image is empty
  if (!image) {
    image =
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/961souqLogo-1_2.png?v=1709718912';
  }

  return getSeoMeta({
    title: truncate(formattedTitle, 60),
    description: truncate(
      product?.seoDescription ||
      product?.description ||
      'Discover this product.',
      150,
    ),
    url: `https://961souq.com/products/${encodeURIComponent(product?.handle)}`,
    media: image,
    jsonLd: [
      {
        '@context': 'http://schema.org/',
        '@type': 'Product',
        name: formattedTitle,
        url: `https://961souq.com/products/${encodeURIComponent(
          product?.handle,
        )}`,
        sku: currentVariant?.sku || product?.id,
        productID: product?.id,
        brand: {
          '@type': 'Brand',
          name: product?.vendor || '961 Souq',
        },
        description: truncate(product?.description || '', 150),
        image:
          product?.firstImage ||
          'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/961souqLogo-1_2.png?v=1709718912',
        offers: variants.map((variant) => ({
          '@type': 'Offer',
          priceCurrency:
            product?.priceRange?.minVariantPrice?.currencyCode || 'USD',
          price: variant?.price?.amount || '0.00',
          itemCondition: 'http://schema.org/NewCondition',
          availability: variant?.availableForSale
            ? 'http://schema.org/InStock'
            : 'http://schema.org/OutOfStock',
          url: `https://961souq.com/products/${encodeURIComponent(
            product?.handle,
          )}?variant=${variant?.id}`,
          image: variant?.image?.url || product?.firstImage || '',
          name: truncate(`${product?.title} - ${variant?.title || ''}`, 140),
          sku: variant?.sku || variant?.id,
          gtin12:
            variant?.barcode?.length === 12 ? variant?.barcode : undefined,
          gtin13:
            variant?.barcode?.length === 13 ? variant?.barcode : undefined,
          gtin14:
            variant?.barcode?.length === 14 ? variant?.barcode : undefined,
          priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
          shippingDetails: {
            '@type': 'OfferShippingDetails',
            shippingRate: {
              '@type': 'MonetaryAmount',
              value: '5.00',
              currency: 'USD',
            },
            shippingDestination: {
              '@type': 'DefinedRegion',
              addressCountry: 'LB',
            },
            deliveryTime: {
              '@type': 'ShippingDeliveryTime',
              handlingTime: {
                '@type': 'QuantitativeValue',
                minValue: 0,
                maxValue: 3,
                unitCode: 'DAY',
              },
              transitTime: {
                '@type': 'QuantitativeValue',
                minValue: 1,
                maxValue: 5,
                unitCode: 'DAY',
              },
            },
          },
          hasMerchantReturnPolicy: {
            '@type': 'MerchantReturnPolicy',
            applicableCountry: 'LB',
            returnPolicyCategory:
              'https://schema.org/MerchantReturnFiniteReturnWindow',
            merchantReturnDays: 5,
            returnMethod: 'https://schema.org/ReturnByMail',
            returnFees: 'https://schema.org/FreeReturn',
          },
        })),
        aggregateRating: product?.metafields?.spr?.reviews
          ? {
            '@type': 'AggregateRating',
            ratingValue: parseFloat(
              product.metafields.spr.reviews
                .split('"ratingValue": "')[1]
                ?.split('"')[0] || 0,
            ),
            ratingCount: parseInt(
              product.metafields.spr.reviews
                .split('"reviewCount": "')[1]
                ?.split('"')[0] || 0,
              10,
            ),
          }
          : undefined,
      },
      {
        '@context': 'http://schema.org/',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://961souq.com',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: formattedTitle,
            item: `https://961souq.com/products/${encodeURIComponent(
              product?.handle,
            )}`,
          },
        ],
      },
    ],
  });
};

// ---------------- Loader
export async function loader(args) {
  return await loadCriticalData(args);
}

function getCleanProductUrl(requestUrl) {
  const url = new URL(requestUrl);

  if (!url.search) return null;

  const params = new URLSearchParams(url.search);
  let removed = false;

  for (const key of Array.from(params.keys())) {
    if (key.startsWith('pr_')) {
      params.delete(key);
      removed = true;
    }
  }

  if (!removed) return null;

  url.search = params.toString() ? `?${params.toString()}` : '';

  return url.toString();
}

async function loadCriticalData({ context, params, request }) {
  const { handle } = params;
  const { storefront } = context;

  if (!handle) {
    throw new Error('Expected product handle to be defined');
  }

  const cleanUrl = getCleanProductUrl(request.url);
  if (cleanUrl) {
    return redirect(cleanUrl, { status: 301 });
  }

  // Fetch product data
  const { product } = await storefront.query(PRODUCT_QUERY, {
    variables: {
      handle,
      selectedOptions: getSelectedProductOptions(request) || [],
    },
  });

  if (!product) {
    throw new Response('Product not found', { status: 404 });
  }

  const { product: fullProduct } = await storefront.query(VARIANTS_QUERY, {
    variables: { handle /* …country/language… */ },
  });

  // Select the first variant as the default if applicable
  const firstVariant = product.variants.nodes[0];
  const firstVariantIsDefault = Boolean(
    firstVariant.selectedOptions.find(
      (option) => option.name === 'Title' && option.value === 'Default Title',
    ),
  );

  // If there's no valid selectedVariant, just assign the firstVariant.
  if (!product.selectedVariant) {
    product.selectedVariant = firstVariant;
  }

  // Extract the first image
  const firstImage = product.images?.edges?.[0]?.node?.url || null;

  // Fetch related products
  // Fetch the collection from the product
  const collection = product?.collections?.edges?.[0]?.node;

  let relatedProducts = [];

  if (product?.id) {
    const { productRecommendations } = await storefront.query(
      RECOMMENDED_PRODUCTS_QUERY,
      {
        variables: {
          productId: product.id,
        },
      },
    );
    relatedProducts = productRecommendations || [];
  }

  // Return necessary product data including SEO, first image, and variant price
  return {
    product: {
      ...product,
      // overwrite `variants` with the plain array of nodes
      variants: fullProduct.variants.nodes,
      firstImage,
      seoTitle: product.seo?.title || product.title,
      seoDescription: product.seo?.description || product.description,
      variantPrice: firstVariant.price || product.priceRange.minVariantPrice,
    },
    relatedProducts,
  };
}

function loadDeferredData({ context, params }) {
  const { storefront } = context;

  const variants = storefront
    .query(VARIANTS_QUERY, {
      variables: { handle: params.handle },
    })
    .catch((error) => {
      console.error(error);
      return null;
    });

  return { variants };
}

function redirectToFirstVariant({ product, request }) {
  const url = new URL(request.url);
  const firstVariant = product.variants.nodes[0];

  return redirect(
    getVariantUrl({
      pathname: `/products/${encodeURIComponent(product.handle)}`,
      handle: product.handle,
      selectedOptions: firstVariant.selectedOptions,
      searchParams: new URLSearchParams(url.search),
    }),
    { status: 302 },
  );
}

// -----------------------------------------------------
//                   ProductForm
// -----------------------------------------------------

function isValueAvailable(allVariants, selectedOptions, optionName, val) {
  const updated = { ...selectedOptions, [optionName]: val };

  // Find any in-stock variant that fully matches updated
  return Boolean(
    allVariants.find((variant) => {
      if (!variant.availableForSale) return false;
      return variant.selectedOptions.every(
        (so) => updated[so.name] === so.value,
      );
    }),
  );
}

function pickOrSnapVariant(allVariants, newOptions, optionName, chosenVal) {
  // 1) Perfect match
  let found = allVariants.find(
    (v) =>
      v.availableForSale &&
      v.selectedOptions.every((so) => newOptions[so.name] === so.value),
  );

  // 2) If no perfect match, fallback
  if (!found) {
    found = allVariants.find((v) => {
      if (!v.availableForSale) return false;
      const picked = v.selectedOptions.find((so) => so.name === optionName);
      return picked && picked.value === chosenVal;
    });
  }

  return found || null;
}

export function ProductForm({
  product,
  onAddToCart,
  selectedVariant,
  onVariantChange,
  variants = [],
  quantity = 1,
}) {
  const location = useLocation();
  const { open } = useAside();
  const isComputerComponent =
    Array.isArray(product?.tags) &&
    product.tags.includes('computer components');

  // ------------------------------
  // Initialize local selectedOptions
  // ------------------------------
  const [selectedOptions, setSelectedOptions] = useState(() => {
    if (selectedVariant?.selectedOptions) {
      return selectedVariant.selectedOptions.reduce((acc, { name, value }) => {
        acc[name] = value;
        return acc;
      }, {});
    }
    // If no initial variant, fallback to the first option value
    return product.options.reduce((acc, option) => {
      acc[option.name] = option.values[0]?.value || '';
      return acc;
    }, {});
  });

  const handleAddToCart = () => {
    // Track the AddToCart event
    trackAddToCart(product);
    trackAddToCartGA(product);
    onAddToCart(product);
  };

  // Sync local state when the parent’s selectedVariant changes
  useEffect(() => {
    if (!selectedVariant?.selectedOptions) return;
    setSelectedOptions(
      selectedVariant.selectedOptions.reduce((acc, { name, value }) => {
        acc[name] = value;
        return acc;
      }, {}),
    );
  }, [selectedVariant, product]);

  // ------------------------------
  // Handle user picking a new value
  // ------------------------------
  function handleOptionChange(optionName, chosenVal) {
    // Build the new options object
    const newOptions = { ...selectedOptions, [optionName]: chosenVal };

    // Attempt to find or “snap” to a variant
    const found = pickOrSnapVariant(
      variants,
      newOptions,
      optionName,
      chosenVal,
    );

    if (found) {
      // Normalize to the found variant’s full options
      const normalized = found.selectedOptions.reduce((acc, { name, value }) => {
        acc[name] = value;
        return acc;
      }, {});

      // Update local state
      setSelectedOptions(normalized);

      // Notify parent
      onVariantChange(found);

      // Update the URL
      const params = new URLSearchParams(normalized).toString();
      window.history.replaceState(null, '', `${location.pathname}?${params}`);
    }
    // else: do nothing (no invalid state)
  }

  // Ensure quantity is safe
  const safeQuantity = Math.max(Number(quantity) || 1, 1);

  // Subcomponent to render each option row
  const ProductOptions = ({ option }) => {
    const { name, values } = option;
    const currentValue = selectedOptions[name];

    return (
      <div className="product-options" key={name}>
        <h5 className="OptionName">
          {name}: <span className="OptionValue">{currentValue}</span>
        </h5>
        <div className="product-options-grid">
          {values.map(({ value, variant }) => {
            const canPick = isValueAvailable(
              variants,
              selectedOptions,
              name,
              value,
            );
            const isActive = currentValue === value;
            const isColorOption = name.toLowerCase() === 'color';
            const variantImage = isColorOption && variant?.image?.url;

            return (
              <button
                key={name + value}
                onClick={() => handleOptionChange(name, value)}
                className={`product-options-item ${isActive ? 'active' : ''}`}
                style={{
                  opacity: canPick ? 1 : 0.3,
                  border: isActive
                    ? '1px solid #2172af'
                    : '1px solid transparent',
                  borderRadius: '5px',
                  transition: 'all 0.3s ease-in-out',
                  backgroundColor: isActive ? '#e6f2ff' : '#f0f0f0',
                  boxShadow: isActive ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                  transform: isActive ? 'scale(0.98)' : 'scale(1)',
                }}
              >
                {variantImage ? (
                  <img
                    src={`${variantImage}&quality=10`}
                    alt={value}
                    width="50"
                    height="50"
                    style={{ objectFit: 'cover' }}
                    onContextMenu={(e) => e.preventDefault()}
                  />
                ) : (
                  value
                )}
              </button>
            );
          })}
        </div>
        <br />
      </div>
    );
  };

  // Possibly build a WhatsApp link
  const isProductPage = location.pathname.includes('/products/');
  const whatsappShareUrl = `https://api.whatsapp.com/send?phone=96171888036&text=${encodeURIComponent(
    `Hi, I'd like to buy ${product.title} https://961souq.com${location.pathname}`,
  )}`;

  // WhatsApp SVG icon
  const WhatsAppIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 175.216 175.552"
      width={40}
      height={40}
    >
      <defs>
        <linearGradient
          id="linearGradient1780"
          x1="85.915"
          x2="86.535"
          y1="32.567"
          y2="137.092"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#57d163" />
          <stop offset="1" stopColor="#23b33a" />
        </linearGradient>
        <filter
          id="a"
          width="1.115"
          height="1.114"
          x="-.057"
          y="-.057"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur stdDeviation="3.531" />
        </filter>
      </defs>
      <path
        fill="#b3b3b3"
        d="m54.532 138.45 2.235 1.324c9.387 5.571 20.15 8.518 31.126 8.523h.023c33.707 0 61.139-27.426 61.153-61.135.006-16.335-6.349-31.696-17.895-43.251A60.75 60.75 0 0 0 87.94 25.983c-33.733 0-61.166 27.423-61.178 61.13a60.98 60.98 0 0 0 9.349 32.535l1.455 2.312-6.179 22.558zm-40.811 23.544L24.16 123.88c-6.438-11.154-9.825-23.808-9.821-36.772.017-40.556 33.021-73.55 73.578-73.55 19.681.01 38.154 7.669 52.047 21.572s21.537 32.383 21.53 52.037c-.018 40.553-33.027 73.553-73.578 73.553h-.032c-12.313-.005-24.412-3.094-35.159-8.954zm0 0"
        filter="url(#a)"
      />
      <path
        fill="#fff"
        d="m12.966 161.238 10.439-38.114a73.42 73.42 0 0 1-9.821-36.772c.017-40.556 33.021-73.55 73.578-73.55 19.681.01 38.154 7.669 52.047 21.572s21.537 32.383 21.53 52.037c-.018 40.553-33.027 73.553-73.578 73.553h-.032c-12.313-.005-24.412-3.094-35.159-8.954z"
      />
      <path
        fill="url(#linearGradient1780)"
        d="M87.184 25.227c-33.733 0-61.166 27.423-61.178 61.13a60.98 60.98 0 0 0 9.349 32.535l1.455 2.312-6.179 22.559 23.146-6.069 2.235 1.324c9.387 5.571 20.15 8.517 31.126 8.523h.023c33.707 0 61.14-27.426 61.153-61.135a60.75 60.75 0 0 0-17.895-43.251 60.75 60.75 0 0 0-43.235-17.928z"
      />
      <path
        fill="#fff"
        fillRule="evenodd"
        d="M68.772 55.603c-1.378-3.061-2.828-3.123-4.137-3.176l-3.524-.043c-1.226 0-3.218.46-4.902 2.3s-6.435 6.287-6.435 15.332 6.588 17.785 7.506 19.013 12.718 20.381 31.405 27.75c15.529 6.124 18.689 4.906 22.061 4.6s10.877-4.447 12.408-8.74 1.532-7.971 1.073-8.74-1.685-1.226-3.525-2.146-10.877-5.367-12.562-5.981-2.91-.919-4.137.921-4.746 5.979-5.819 7.206-2.144 1.381-3.984.462-7.76-2.861-14.784-9.124c-5.465-4.873-9.154-10.891-10.228-12.73s-.114-2.835.808-3.751c.825-.824 1.838-2.147 2.759-3.22s1.224-1.84 1.836-3.065.307-2.301-.153-3.22-4.032-10.011-5.666-13.647"
      />
    </svg>
  );

  // near other locals in ProductForm (after whatsappShareUrl / icons is fine)
  const canWishlist = !!(
    selectedVariant &&
    selectedVariant.availableForSale &&
    Number(selectedVariant?.price?.amount) > 0
  );
  const selectedVariantForCart = selectedVariant
    ? {
        id: selectedVariant.id,
        title: selectedVariant.title,
        image: selectedVariant.image,
        selectedOptions: selectedVariant.selectedOptions ?? [],
        product: {
          title: product?.title,
          handle: product?.handle,
        },
      }
    : null;

  return (
    <>
      <VariantSelector
        handle={product.handle}
        options={product.options.filter((o) => o.values.length > 1)}
        variants={variants}
      >
        {({ option }) => <ProductOptions key={option.name} option={option} />}
      </VariantSelector>

      <div className="product-form">
        <AddToCartButton
          disabled={
            !selectedVariant ||
            !selectedVariant.availableForSale ||
            (selectedVariant?.price &&
              Number(selectedVariant.price.amount) === 0)
          }
          onClick={() => {
            if (
              !(
                selectedVariant?.price &&
                Number(selectedVariant.price.amount) === 0
              )
            ) {
              handleAddToCart();
              open('cart');
            }
          }}
          lines={
            selectedVariantForCart
              ? [
                  {
                    merchandiseId: selectedVariantForCart.id,
                    quantity: safeQuantity,
                    selectedVariant: selectedVariantForCart,
                  },
                ]
              : []
          }
          contentId={product.id}
        >
          {selectedVariant?.price && Number(selectedVariant.price.amount) === 0
            ? 'Call For Price'
            : selectedVariant?.availableForSale
              ? 'Add to cart'
              : 'Sold out'}
        </AddToCartButton>
        {isComputerComponent && (
          <span className="computer-components-note">
            Due to high demand and limited stock, computer components may have
            variable availability and prices. Please contact us via WhatsApp to
            confirm stock before placing your order.
          </span>
        )}

        <div className="wishlist-whatsapp-container">
          {isProductPage && (
            <a
              href={whatsappShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="whatsapp-share-button"
              aria-label="Share on WhatsApp"
            >
              <WhatsAppIcon />
            </a>
          )}
          {canWishlist && (
            <WishlistButton product={product} variantId={selectedVariant?.id} />
          )}
        </div>
      </div>
    </>
  );
}

// -----------------------------------------------------
//                   Main Product
// -----------------------------------------------------
export default function Product() {
  const { product, relatedProducts } = useLoaderData();
  const variants = product.variants;
  const descriptionRef = useRef(null);
  const shippingRef = useRef(null);
  const warrantyRef = useRef(null);
  const location = useLocation();

  // Safeguard
  if (!product) {
    return <div>Loading product data...</div>;
  }

  // -------- State (before effects) --------
  const [selectedVariant, setSelectedVariant] = useState(
    product.selectedVariant,
  );
  const [quantity, setQuantity] = useState(1);
  const [subtotal, setSubtotal] = useState(0);
  const [activeTab, setActiveTab] = useState('description');
  const productFAQRef = React.useRef(null);

  // ------------------------------
  // AI SUMMARY (modal version)
  // ------------------------------
  const initialAiSummary = (product?.metafieldAiSummary?.value || '').trim();
  const [aiSummary, setAiSummary] = useState(initialAiSummary);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiSummaryDisplay, setAiSummaryDisplay] = useState('');
  const [aiSummaryStatus, setAiSummaryStatus] = useState('idle'); // idle | loading | typing | done | error

  const aiTypingTimerRef = useRef(null);
  const aiOpenDelayRef = useRef(null);

  const prefersReducedMotion = React.useCallback(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  }, []);

  const stopTyping = React.useCallback(() => {
    if (aiTypingTimerRef.current) {
      clearInterval(aiTypingTimerRef.current);
      aiTypingTimerRef.current = null;
    }
  }, []);

  const clearAiOpenDelay = React.useCallback(() => {
    if (aiOpenDelayRef.current) {
      clearTimeout(aiOpenDelayRef.current);
      aiOpenDelayRef.current = null;
    }
  }, []);

  const startTyping = React.useCallback(
    (text) => {
      stopTyping();

      const clean = (text || '').trim();
      if (!clean) {
        setAiSummaryDisplay('');
        setAiSummaryStatus('done');
        return;
      }

      if (prefersReducedMotion()) {
        setAiSummaryDisplay(clean);
        setAiSummaryStatus('done');
        return;
      }

      setAiSummaryDisplay('');
      setAiSummaryStatus('typing');

      let i = 0;
      aiTypingTimerRef.current = setInterval(() => {
        i += 2;
        const next = clean.slice(0, i);
        setAiSummaryDisplay(next);

        if (i >= clean.length) {
          stopTyping();
          setAiSummaryStatus('done');
        }
      }, 14);
    },
    [prefersReducedMotion, stopTyping],
  );

  const closeAiSummaryModal = React.useCallback(() => {
    clearAiOpenDelay();
    stopTyping();
    setAiModalOpen(false);
    setAiSummaryDisplay('');
    setAiSummaryStatus('idle');
  }, [clearAiOpenDelay, stopTyping]);

  const openAiSummaryModal = React.useCallback(async () => {
    clearAiOpenDelay();
    stopTyping();

    setAiModalOpen(true);
    setAiSummaryDisplay('');
    setAiSummaryStatus('loading');

    // Always show a small “Generating…” phase even if cached
    const minDelay = 520 + Math.floor(Math.random() * 260);
    const started = Date.now();

    try {
      let summaryText = (aiSummary || '').trim();

      // Only call the API if we truly do not have it yet
      if (!summaryText) {
        const res = await fetch('/api/product-summary', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ productId: product.id }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data?.error || 'Failed to generate summary');
        }

        summaryText = (data?.summary || '').trim();
        setAiSummary(summaryText);
      }

      const elapsed = Date.now() - started;
      const remaining = Math.max(0, minDelay - elapsed);

      await new Promise((resolve) => {
        aiOpenDelayRef.current = setTimeout(resolve, remaining);
      });
      aiOpenDelayRef.current = null;

      // Always re-type every open
      startTyping(summaryText);
    } catch (e) {
      clearAiOpenDelay();
      stopTyping();
      setAiSummaryStatus('error');
      setAiSummaryDisplay('');
    }
  }, [aiSummary, product?.id, clearAiOpenDelay, stopTyping, startTyping]);

  // lock scroll + close on ESC when modal is open
  useEffect(() => {
    if (!aiModalOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeAiSummaryModal();
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [aiModalOpen, closeAiSummaryModal]);

  // Reset AI state when product changes
  useEffect(() => {
    clearAiOpenDelay();
    stopTyping();

    const fresh = (product?.metafieldAiSummary?.value || '').trim();
    setAiSummary(fresh);
    setAiModalOpen(false);
    setAiSummaryDisplay('');
    setAiSummaryStatus('idle');
  }, [
    product?.id,
    product?.metafieldAiSummary?.value,
    clearAiOpenDelay,
    stopTyping,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAiOpenDelay();
      stopTyping();
    };
  }, [clearAiOpenDelay, stopTyping]);

  // -------- Effects --------

  // Reset selectedVariant, quantity, and subtotal when product changes
  useEffect(() => {
    if (product?.selectedVariant) {
      setSelectedVariant(product.selectedVariant);
      setQuantity(1);
      setSubtotal(0);
    }
  }, [product?.id, product?.handle, product?.selectedVariant?.id]);

  // Pixel / analytics
  useEffect(() => {
    trackViewContent(product);
  }, [product]);

  // Edge-cacheable tracking endpoint (per view)
  const trackOnceRef = useRef(false);
  useEffect(() => {
    if (!product?.handle || trackOnceRef.current) return;
    trackOnceRef.current = true;

    fetch('/api/track/view', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ handle: product.handle }),
    }).catch(() => { });
  }, [product?.handle]);

  // Subtotal
  useEffect(() => {
    if (selectedVariant?.price) {
      const price = parseFloat(selectedVariant.price.amount);
      setSubtotal(price * quantity);
    }
  }, [quantity, selectedVariant]);

  // -------- Locals --------
  const incrementQuantity = () => setQuantity((prev) => prev + 1);
  const decrementQuantity = () =>
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  const { title, descriptionHtml } = product;

  const hasDiscount =
    selectedVariant?.compareAtPrice &&
    selectedVariant?.price?.amount !== selectedVariant?.compareAtPrice?.amount;

  const onAddToCart = (prod) => {
    // trackAddToCart(prod);
  };

  const mediaItems =
    product.media?.edges && product.media.edges.length > 0
      ? product.media.edges
      : product.images?.edges?.map((edge) => ({
        node: {
          __typename: 'MediaImage',
          image: edge.node,
        },
      })) || [];

  const whatsappShareUrl = `https://api.whatsapp.com/send?phone=96171888036&text=Hi, I would like to buy ${product.title} https://961souq.com${location.pathname}`;

  return (
    <div className="product">
      <div className="ProductPageTop">
        {/* 
          Replace media={product.media.edges} with images={product.images?.edges || []} 
          and rely on selectedVariantImage to update when variant changes.
        */}
        <ProductImages
          media={mediaItems}
          selectedVariantImage={selectedVariant?.image}
        />
        <div className="product-main">
          <h1>{title}</h1>
          {/* AI SUMMARY (button + modal) - COMMENTED OUT */}
          {/* <div className="ai-summary">
            <div className="ai-summary__header">
              <div className="ai-summary__badge">
                <span className="ai-summary__title">AI Summary</span>
                <span className="ai-summary__dot" aria-hidden="true" />
              </div>

              <button
                type="button"
                className="ai-summary__action"
                onClick={openAiSummaryModal}
                disabled={aiSummaryStatus === 'loading'}
              >
                {aiSummaryStatus === 'loading'
                  ? 'Generating…'
                  : 'Generate summary'}
              </button>
            </div>
          </div>
          {aiModalOpen && (
            <div className="ai-modal-overlay" onClick={closeAiSummaryModal}>
              <div className="ai-modal" onClick={(e) => e.stopPropagation()}>
                <div className="ai-modal__header">
                  <div className="ai-modal__left">
                    <span className="ai-modal__chip">AI Summary</span>
                    <span className="ai-modal__status">
                      {aiSummaryStatus === 'loading'
                        ? 'Generating'
                        : aiSummaryStatus === 'typing'
                        ? 'Writing'
                        : aiSummaryStatus === 'done'
                        ? 'Ready'
                        : aiSummaryStatus === 'error'
                        ? 'Error'
                        : ''}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="ai-modal__close"
                    onClick={closeAiSummaryModal}
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>

                <div className="ai-modal__body" aria-live="polite">
                  {aiSummaryStatus === 'error' ? (
                    <p className="ai-modal__error">
                      Could not generate the summary. Please try again.
                    </p>
                  ) : aiSummaryStatus === 'loading' ? (
                    <div className="ai-modal__skeleton" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                    </div>
                  ) : (
                    <p className="ai-modal__text">
                      {aiSummaryDisplay || ''}
                      {aiSummaryStatus === 'typing' && (
                        <span className="ai-modal__cursor" aria-hidden="true">
                          ▍
                        </span>
                      )}
                    </p>
                  )}
                </div>

                <div className="ai-modal__footer">
                  <p>
                    {' '}
                    WhatsApp:&nbsp;
                    <a
                      href={whatsappShareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Share on WhatsApp"
                    >
                      Customer Support
                    </a>
                  </p>
                  <button
                    type="button"
                    className="ai-modal__secondary"
                    onClick={closeAiSummaryModal}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )} */}

          {/* Ask AI Button Component */}
          <AskAIButton productId={product.id} productFAQRef={productFAQRef} />
          <div className="price-container">
            <small
              className={`product-price ${
                Number(selectedVariant.price.amount) > 0 &&
                selectedVariant.compareAtPrice &&
                parseFloat(selectedVariant.compareAtPrice.amount) >
                  parseFloat(selectedVariant.price.amount)
                  ? 'discounted'
                  : ''
              }`}
            >
              {Number(selectedVariant.price.amount) === 0 ? (
                <span>Call For Price!</span>
              ) : (
                <span style={{display: 'flex', alignItems: 'center'}}>
                  <Money data={selectedVariant.price} />
                  {product.metafieldVat?.value === 'Excluding VAT' && (
                    <>
                      &nbsp; HT &nbsp;
                    </>
                  )}
                </span>
              )}
            </small>

            {Number(selectedVariant.price.amount) > 0 &&
              selectedVariant.compareAtPrice &&
              parseFloat(selectedVariant.compareAtPrice.amount) >
                parseFloat(selectedVariant.price.amount) && (
                <small className="discountedPrice">
                  <Money data={selectedVariant.compareAtPrice} />
                </small>
              )}
          </div>
          <div className="quantity-selector">
            <p>Quantity</p>
            <button onClick={decrementQuantity} className="quantity-btn">
              -
            </button>
            <span className="quantity-display">{quantity}</span>
            <button onClick={incrementQuantity} className="quantity-btn">
              +
            </button>
          </div>
          <div className="subtotal">
            <strong>Subtotal: </strong>
            {subtotal.toLocaleString('en-US', {
              style: 'currency',
              currency: selectedVariant?.price?.currencyCode || 'USD',
            })}
          </div>
          <ProductForm
            product={product}
            selectedVariant={selectedVariant}
            onVariantChange={setSelectedVariant}
            onAddToCart={onAddToCart}
            // formerly `variants={[]}` or undefined, now a real array
            variants={variants}
            quantity={quantity}
          />
          <hr className="productPage-hr" />
          <div className="product-details">
            <ul>
              <li>
                <strong>Vendor:</strong> {product.vendor || 'N/A'}
              </li>
              <li>
                <strong>SKU:</strong> {selectedVariant?.sku || 'N/A'}
              </li>
              <li>
                <strong>Availability:</strong>{' '}
                {!selectedVariant
                  ? 'N/A'
                  : typeof selectedVariant.quantityAvailable === 'number' &&
                    selectedVariant.quantityAvailable > 0
                  ? `${selectedVariant.quantityAvailable} in stock`
                  : selectedVariant.availableForSale
                  ? 'In Stock'
                  : 'Out of Stock'}
              </li>

              <li>
                <strong>Product Type:</strong> {product.productType || 'N/A'}
              </li>
            </ul>
          </div>
          <hr className="productPage-hr" />
          <ProductMetafields
            metafieldCondition={product.metafieldCondition}
            metafieldWarranty={product.metafieldWarranty}
            metafieldShipping={product.metafieldShipping}
            // metafieldVat={product.metafieldVat}
          />
          {product.metafieldVat?.value === 'Excluding VAT' && (
            <span
              style={{fontSize: '14px', fontStyle: 'italic', fontWeight: '300'}}
            >
              Excluding VAT
            </span>
          )}
          <p className="productPageDisclaimer">
            Product images are for reference only. The actual item may differ in
            appearance & colour. Please refer to the product code, SKU, and
            description from manufacturer website for accurate specifications.
          </p>
        </div>
      </div>

      <div className="ProductPageBottom">
        <>
          <div className="tabs">
            <button
              className={`tab-button ${
                activeTab === 'description' ? 'active' : ''
              }`}
              onClick={() => setActiveTab('description')}
            >
              Description
            </button>
            <button
              className={`tab-button ${
                activeTab === 'shipping' ? 'active' : ''
              }`}
              onClick={() => setActiveTab('shipping')}
            >
              Shipping & Exchange
            </button>
            <button
              className={`tab-button ${
                activeTab === 'warranty' ? 'active' : ''
              }`}
              onClick={() => setActiveTab('warranty')}
            >
              Warranty
            </button>
          </div>

          {activeTab === 'description' && (
            <div className="product-section">
              <div className="ai-summary">
                <div className="ai-summary__header">
                  <button
                    type="button"
                    className="ai-summary__action"
                    onClick={openAiSummaryModal}
                    disabled={aiSummaryStatus === 'loading'}
                  >
                    {aiSummaryStatus === 'loading'
                      ? 'Generating…'
                      : 'Generate summary'}
                  </button>
                </div>
              </div>
              {aiModalOpen && (
                <div className="ai-modal-overlay" onClick={closeAiSummaryModal}>
                  <div
                    className="ai-modal"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="ai-modal__header">
                      <div className="ai-modal__left">
                        <span className="ai-modal__chip">AI Summary</span>
                        <span className="ai-modal__status">
                          {aiSummaryStatus === 'loading'
                            ? 'Generating'
                            : aiSummaryStatus === 'typing'
                            ? 'Writing'
                            : aiSummaryStatus === 'done'
                            ? 'Ready'
                            : aiSummaryStatus === 'error'
                            ? 'Error'
                            : ''}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="ai-modal__close"
                        onClick={closeAiSummaryModal}
                        aria-label="Close"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="ai-modal__body" aria-live="polite">
                      {aiSummaryStatus === 'error' ? (
                        <p className="ai-modal__error">
                          Could not generate the summary. Please try again.
                        </p>
                      ) : aiSummaryStatus === 'loading' ? (
                        <div className="ai-modal__skeleton" aria-hidden="true">
                          <span />
                          <span />
                          <span />
                        </div>
                      ) : (
                        <p className="ai-modal__text">
                          {aiSummaryDisplay || ''}
                          {aiSummaryStatus === 'typing' && (
                            <span
                              className="ai-modal__cursor"
                              aria-hidden="true"
                            >
                              ▍
                            </span>
                          )}
                        </p>
                      )}
                    </div>

                    <div className="ai-modal__footer">
                      <p>
                        {' '}
                        WhatsApp:&nbsp;
                        <a
                          href={whatsappShareUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Share on WhatsApp"
                        >
                          Customer Support
                        </a>
                      </p>
                      <button
                        type="button"
                        className="ai-modal__secondary"
                        onClick={closeAiSummaryModal}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <div dangerouslySetInnerHTML={{__html: descriptionHtml || ''}} />

              {product.metafieldOfficialProductLink?.value && (
                <p style={{marginTop: '1.5rem'}}>
                  <a
                    className="official-product-link"
                    href={product.metafieldOfficialProductLink.value}
                    target="_blank"
                    rel="noopener"
                  >
                    View official product page
                  </a>
                </p>
              )}
            </div>
          )}

          {activeTab === 'faq' && (
            <div className="product-section ask-ai-section">
              {/* Section content can go here if needed */}
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="product-section">
              <h3>Shipping Policy</h3>
              <p>
                We offer shipping across all Lebanon, facilitated by our
                dedicated delivery team servicing the Beirut district and
                through our partnership with Wakilni for orders beyond Beirut.
              </p>
              <p>
                Upon placing an order, we provide estimated shipping and
                delivery dates tailored to your item's availability and selected
                product options. For precise shipping details, kindly reach out
                to us through the contact information listed in our Contact Us
                section.
              </p>
              <p>
                Please be aware that shipping rates may vary depending on the
                destination.
              </p>
              <h3>Exchange Policy</h3>
              <p>
                We operate a 3-day exchange policy, granting you 3 days from
                receipt of your item to initiate an exchange.
              </p>
              <p>
                To qualify for an exchange, your item must remain in its
                original condition, unworn or unused, with tags intact, and in
                its original sealed packaging. Additionally, you will need to
                provide a receipt or proof of purchase.
              </p>
              <p>
                To initiate an exchange, please contact us at admin@961souq.com.
                Upon approval of your exchange request, we will furnish you with
                an exchange shipping label along with comprehensive instructions
                for package return. Please note that exchanges initiated without
                prior authorization will not be accepted.
              </p>
              <div class="policy-container">
                <h3>Shipping Policy</h3>
                <p>
                  We offer nationwide shipping across Lebanon, facilitated by
                  our dedicated delivery team servicing the Beirut district and
                  through our partnership with Wakilni for orders beyond Beirut.
                </p>
                <p>
                  Upon placing an order, we provide estimated shipping and
                  delivery dates tailored to your item's availability and
                  selected product options. For precise shipping details, kindly
                  reach out to us through the contact information listed in our
                  Contact Us section.
                </p>
                <p>
                  Please be aware that shipping rates may vary depending on the
                  destination.
                </p>
                <h3>Exchange Policy</h3>
                <p>
                  We operate a 3-day exchange policy, granting you 3 days from
                  receipt of your item to initiate an exchange.
                </p>
                <p>
                  To qualify for an exchange, your item must remain in its
                  original condition, unworn or unused, with tags intact, and in
                  its original unsealed packaging. Additionally, you will need
                  to provide a receipt or proof of purchase.
                </p>
                <p>
                  To initiate an exchange, please contact us at
                  admin@961souq.com. Upon approval of your exchange request, we
                  will furnish you with an exchange shipping label along with
                  comprehensive instructions for package return. Please note
                  that exchanges initiated without prior authorization will not
                  be accepted.
                </p>
                <p>
                  Should you encounter any damages or issues upon receiving your
                  order, please inspect the item immediately and notify us
                  promptly. We will swiftly address any defects, damages, or
                  incorrect shipments to ensure your satisfaction.
                </p>
                <h3 style={{color: '#2172af'}}>
                  Exceptions / Non-exchangeable Items
                </h3>
                <p>
                  Certain items are exempt from our exchange policy, including{' '}
                  <strong style={{color: '#2172af'}}>mobile phones</strong>,
                  perishable goods (such as{' '}
                  <strong style={{color: '#2172af'}}>headsets</strong>,{' '}
                  <strong style={{color: '#2172af'}}>earphones</strong>, and{' '}
                  <strong style={{color: '#2172af'}}>network card </strong>
                  or <strong style={{color: '#2172af'}}>wifi routers</strong>
                  ), custom-made products (such as{' '}
                  <strong style={{color: '#2172af'}}>
                    special orders
                  </strong> or{' '}
                  <strong style={{color: '#2172af'}}>personalized items</strong>
                  ), and{' '}
                  <strong style={{color: '#2172af'}}>pre-ordered goods</strong>.
                  For queries regarding specific items, please reach out to us.
                </p>
                <p>
                  Unfortunately, we are{' '}
                  <strong style={{color: '#2172af'}}>
                    unable to accommodate exchanges for sale items or gift
                    cards.
                  </strong>
                </p>
              </div>
            </div>
          )}

          {activeTab === 'warranty' && (
            <div className="product-section">
              <h3>Operational Warranty Terms and Conditions</h3>
              <h3>Warranty Coverage</h3>
              <p>
                This warranty applies to All Products, purchased from 961 Souq.
                The warranty covers defects in materials and workmanship under
                normal use for the period specified at the time of purchase.
              </p>
              <h3>What is Covered</h3>
              <p>
                During the warranty period, 961 Souq will repair or replace, at
                no charge, any parts that are found to be defective due to
                faulty materials or poor workmanship. This warranty is valid
                only for the original purchaser and is non-transferable.
              </p>
              <h3>What is Not Covered</h3>
              <p>This warranty does not cover:</p>
              <ul>
                <li>
                  Any Physical Damage, damage due to misuse, abuse, accidents,
                  modifications, or unauthorized repairs.
                </li>
                <li>
                  Wear and tear from regular usage, including cosmetic damage
                  like scratches or dents.
                </li>
                <li>
                  Damage caused by power surges, lightning strikes, or
                  electrical malfunctions.
                </li>
                <li>Products with altered or removed serial numbers.</li>
                <li>Software-related issues</li>
              </ul>
              <h3>Warranty Claim Process</h3>
              <p>To make a claim under this warranty:</p>
              <ol>
                <li>
                  Contact admin@961souq.com with proof of purchase and a
                  detailed description of the issue.
                </li>
                <li>
                  961 Souq will assess the product and, if deemed defective,
                  repair or replace the item at no cost.
                </li>
              </ol>
              <h3>Limitations and Exclusions</h3>
              <p>
                This warranty is limited to repair or replacement. 961 Souq will
                not be liable for any indirect, consequential, or incidental
                damages, including loss of data or loss of profits.
              </p>
            </div>
          )}
        </>

        <Analytics.ProductView
          data={{
            products: [
              {
                id: product.id,
                title: product.title,
                price: selectedVariant?.price?.amount || '0',
                vendor: product.vendor,
                variantId: selectedVariant?.id || '',
                variantTitle: selectedVariant?.title || '',
                quantity: 1,
              },
            ],
          }}
        />
      </div>

      <div className="related-products-row">
        <div className="related-products">
          <RelatedProductsRow products={relatedProducts || []} />
        </div>
      </div>
      <div className="recently-viewed-container">
        <RecentlyViewedProducts currentProductId={product.id} />
      </div>
    </div>
  );
}

// -----------------------------------------------------
//                   GraphQL
// -----------------------------------------------------

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
    quantityAvailable
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    product {
      title
      handle
      images(first: 50) {
        edges {
          node {
            __typename
            id
            url
            altText
            width
            height
          }
        }
      }
    }
    selectedOptions {
      name
      value
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
  }
`;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    descriptionHtml
    description
    productType
    tags
    collections(first: 1) {
      edges {
        node {
          id
          handle
          title
        }
      }
    }

    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
      maxVariantPrice {
        amount
        currencyCode
      }
    }

    # Fetch product images for SEO or fallback usage
    images(first: 50) {
      edges {
        node {
          __typename
          id
          url
          altText
          width
          height
        }
      }
    }

    # Add media for images / video (YouTube) / 3D, etc.
    media(first: 50) {
      edges {
        node {
          __typename
          mediaContentType
          alt
          ... on MediaImage {
            id
            image {
              url
              altText
              width
              height
            }
          }
          ... on Video {
            id
            sources {
              url
              mimeType
            }
          }
          ... on ExternalVideo {
            id
            embedUrl
            host
          }
          ... on Model3d {
            id
            sources {
              url
            }
          }
        }
      }
    }

    options {
      name
      values
    }
    selectedVariant: variantBySelectedOptions(selectedOptions: $selectedOptions) {
      ...ProductVariant
    }
    variants(first: 1) {
      nodes {
        ...ProductVariant
      }
    }
    seo {
      description
      title
    }
    metafieldOfficialProductLink: metafield(namespace: "custom", key: "official_product_link") {
      value
    }
    metafieldCondition: metafield(namespace: "custom", key: "condition") {
      value
    }
    metafieldWarranty: metafield(namespace: "custom", key: "warranty") {
      value
    }
    metafieldShipping: metafield(namespace: "custom", key: "shipping") {
      value
    }
    metafieldVat: metafield(namespace: "custom", key: "vat") {
      value
    }

    # AI SUMMARY (added)
    metafieldAiSummary: metafield(namespace: "custom", key: "ai_summary") {
      value
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
`;

const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
  }
  ${PRODUCT_FRAGMENT}
`;

const PRODUCT_VARIANTS_FRAGMENT = `#graphql
  fragment ProductVariants on Product {
    variants(first: 250) {
      nodes {
        ...ProductVariant
      }
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
`;

const VARIANTS_QUERY = `#graphql
  ${PRODUCT_VARIANTS_FRAGMENT}
  query ProductVariants(
    $country: CountryCode
    $language: LanguageCode
    $handle: String!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...ProductVariants
    }
  }
`;
