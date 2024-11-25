import React, { Suspense, useEffect, useState } from 'react';
import { defer, redirect } from '@shopify/remix-oxygen';
import { Await, useLoaderData } from '@remix-run/react';
import {
  getSelectedProductOptions,
  Analytics,
  useOptimisticVariant,
  Money,
} from '@shopify/hydrogen';
import { getVariantUrl } from '~/lib/variants';
import { ProductPrice } from '~/components/ProductPrice';
import { ProductImages } from '~/components/ProductImage';
import { ProductForm } from '~/components/ProductForm';
import "../styles/ProductPage.css"
import { DirectCheckoutButton } from '../components/ProductForm';
import { CSSTransition } from 'react-transition-group';
import { RELATED_PRODUCTS_QUERY } from '~/lib/fragments';
import RelatedProductsRow from '~/components/RelatedProducts';
import { ProductMetafields } from '~/components/Metafields';

export const meta = ({ data }) => {
  return [{ title: `Hydrogen | ${data?.product.title ?? ''}` }];
};

export async function loader(args) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);

  return defer({ ...deferredData, ...criticalData });
}

async function loadCriticalData({ context, params, request }) {
  const { handle } = params;
  const { storefront } = context;

  if (!handle) {
    throw new Error('Expected product handle to be defined');
  }

  const { product } = await storefront.query(PRODUCT_QUERY, {
    variables: { handle, selectedOptions: getSelectedProductOptions(request) || [] },
  });

  if (!product?.id) {
    throw new Response('Product not found', { status: 404 });
  }

  const firstVariant = product.variants.nodes[0];
  const firstVariantIsDefault = Boolean(
    firstVariant.selectedOptions.find(
      (option) => option.name === 'Title' && option.value === 'Default Title'
    )
  );

  if (firstVariantIsDefault) {
    product.selectedVariant = firstVariant;
  } else if (!product.selectedVariant) {
    throw redirectToFirstVariant({ product, request });
  }

  const productType = product.productType || 'General';

  // Fetch related products
  const { products } = await storefront.query(RELATED_PRODUCTS_QUERY, {
    variables: { productType },
  });

  const relatedProducts = products?.edges.map((edge) => edge.node) || [];

  return { product, relatedProducts };
}

function loadDeferredData({ context, params }) {
  const { storefront } = context;

  const variants = storefront.query(VARIANTS_QUERY, {
    variables: { handle: params.handle },
  }).catch((error) => {
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
      pathname: `/products/${product.handle}`,
      handle: product.handle,
      selectedOptions: firstVariant.selectedOptions,
      searchParams: new URLSearchParams(url.search),
    }),
    { status: 302 }
  );
}

export default function Product() {
  const { product, variants, relatedProducts } = useLoaderData();
  const selectedVariant = useOptimisticVariant(
    product.selectedVariant,
    variants
  );

  const [quantity, setQuantity] = useState(1);
  const [subtotal, setSubtotal] = useState(0);

  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  const [activeTab, setActiveTab] = useState('description');

  useEffect(() => {
    if (selectedVariant && selectedVariant.price) {
      const price = parseFloat(selectedVariant.price.amount);
      setSubtotal(price * quantity);
    }
  }, [quantity, selectedVariant]);


  const { title, descriptionHtml, images } = product;

  const hasDiscount = selectedVariant?.compareAtPrice &&
    selectedVariant.price.amount !== selectedVariant.compareAtPrice.amount;

  return (
    <div className="product">
      <div className="ProductPageTop">
        <ProductImages images={images.edges}
          selectedVariantImage={selectedVariant?.image} />
        <div className="product-main">
          <h1>{title}</h1>
          <div className="price-container">
            <small className={`product-price ${hasDiscount ? 'discounted' : ''}`}>
              <Money data={selectedVariant.price} />
            </small>
            {hasDiscount && selectedVariant.compareAtPrice && (
              <small className="discountedPrice">
                <Money data={selectedVariant.compareAtPrice} />
              </small>
            )}
          </div>
          <div className="quantity-selector">
            <p>Quantity</p>
            <button onClick={decrementQuantity} className="quantity-btn">-</button>
            <span className="quantity-display">{quantity}</span>
            <button onClick={incrementQuantity} className="quantity-btn">+</button>
          </div>
          <div className="subtotal">
            <strong>Subtotal: </strong>
            {subtotal.toLocaleString('en-US', { style: 'currency', currency: selectedVariant?.price?.currencyCode || 'USD' })}
          </div>
          <Suspense
            fallback={
              <ProductForm
                product={product}
                selectedVariant={selectedVariant}
                variants={[]}
                quantity={Number(quantity)}
              />
            }
          >
            <Await resolve={variants} errorElement="There was a problem loading product variants">
              {(data) => (
                <><ProductForm
                  product={product}
                  selectedVariant={selectedVariant}
                  variants={data?.product?.variants.nodes || []}
                  quantity={quantity} />
                  <DirectCheckoutButton
                    selectedVariant={selectedVariant}
                    quantity={quantity} />
                </>
              )}
            </Await>
          </Suspense>
          <hr className='productPage-hr'></hr>
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
                {selectedVariant?.availableForSale ? 'In Stock' : 'Out of Stock'}
              </li>
              <li>
                <strong>Product Type:</strong> {product.productType || 'N/A'}
              </li>
            </ul>
          </div>
          <hr className='productPage-hr'></hr>
          <ProductMetafields
            metafieldCondition={product.metafieldCondition}
            metafieldWarranty={product.metafieldWarranty}
            metafieldShipping={product.metafieldShipping}
            metafieldVat={product.metafieldVat}
          />
        </div>
      </div>
      <div className="ProductPageBottom">
        <div className="tabs">
          <button
            className={`tab-button ${activeTab === 'description' ? 'active' : ''}`}
            onClick={() => setActiveTab('description')}
          >
            Description
          </button>
          <button
            className={`tab-button ${activeTab === 'shipping' ? 'active' : ''}`}
            onClick={() => setActiveTab('shipping')}
          >
            Shipping & Exchange
          </button>
          <button
            className={`tab-button ${activeTab === 'warranty' ? 'active' : ''}`}
            onClick={() => setActiveTab('warranty')}
          >
            Warranty
          </button>
        </div>

        <CSSTransition
          in={activeTab === 'description'}
          timeout={200}
          classNames="fade"
          unmountOnExit
        >
          <div className="product-section">
            <div dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
          </div>
        </CSSTransition>

        <CSSTransition
          in={activeTab === 'shipping'}
          timeout={200}
          classNames="fade"
          unmountOnExit
        >
          <div className="product-section">
            <h3>Shipping Policy</h3>
            <p>We offer shipping across all Lebanon, facilitated by our dedicated delivery team servicing the Beirut district and through our partnership with Wakilni for orders beyond Beirut.</p>
            <p>Upon placing an order, we provide estimated shipping and delivery dates tailored to your item's availability and selected product options. For precise shipping details, kindly reach out to us through the contact information listed in our Contact Us section.</p>
            <p>Please be aware that shipping rates may vary depending on the destination.</p>
            <h3>Exchange Policy</h3>
            <p>We operate a 3-day exchange policy, granting you 3 days from receipt of your item to initiate an exchange.</p>
            <p>To qualify for an exchange, your item must remain in its original condition, unworn or unused, with tags intact, and in its original sealed packaging. Additionally, you will need to provide a receipt or proof of purchase.</p>
            <p>To initiate an exchange, please contact us at admin@961souq.com. Upon approval of your exchange request, we will furnish you with an exchange shipping label along with comprehensive instructions for package return. Please note that exchanges initiated without prior authorization will not be accepted.</p>
            <p>Should you encounter any damages or issues upon receiving your order, please inspect the item immediately and notify us promptly. We will swiftly address any defects, damages, or incorrect shipments to ensure your satisfaction.</p>
            <h5>Exceptions / Non-exchangeable Items</h5>
            <p>Certain items are exempt from our exchange policy, including perishable goods (such as headsets, earphones, and network card wifi routers), custom-made products (such as special orders or personalized items), and pre-ordered goods. For queries regarding specific items, please reach out to us.</p>
            <p>Unfortunately, we are unable to accommodate exchanges for sale items or gift cards.</p>
            <h5>Exchanges</h5>
            <p>The most efficient method to secure the item you desire is to exchange the original item, and upon acceptance of your exchange, proceed with a separate purchase for the desired replacement.</p>
          </div>
        </CSSTransition>

        <CSSTransition
          in={activeTab === 'warranty'}
          timeout={200}
          classNames="fade"
          unmountOnExit
        >
          <div className="product-section">
            <h3>Operational Warranty Terms and Conditions</h3>
            <h3>Warranty Coverage</h3>
            <p>This warranty applies to All Products, purchased from 961 Souq. The warranty covers defects in materials and workmanship under normal use for the period specified at the time of purchase. Warranty periods vary based on the product category.</p>
            <h3>What is Covered</h3>
            <p>During the warranty period, 961 Souq will repair or replace, at no charge, any parts that are found to be defective due to faulty materials or poor workmanship. This warranty is valid only for the original purchaser and is non-transferable.</p>
            <h3>What is Not Covered</h3>
            <p >This warranty does not cover:</p>
            <ul>
              <li>Any Physical Damage, damage due to misuse, abuse, accidents, modifications, or unauthorized repairs.</li>
              <li>Wear and tear from regular usage, including cosmetic damage like scratches or dents.</li>
              <li>Damage caused by power surges, lightning strikes, or electrical malfunctions.</li>
              <li>Products with altered or removed serial numbers.</li>
              <li>Software-related issues</li>
            </ul>
            <h3>Warranty Claim Process</h3>
            <p>To make a claim under this warranty:</p>
            <ol>
              <li>Contact admin@961souq.com with proof of purchase and a detailed description of the issue.</li>
              <li>961 Souq will assess the product and, if deemed defective, repair or replace the item at no cost.</li>
            </ol>
            <h3>Limitations and Exclusions</h3>
            <p>This warranty is limited to repair or replacement. 961 Souq will not be liable for any indirect, consequential, or incidental damages, including loss of data or loss of profits.</p>
          </div>
        </CSSTransition>
        <Analytics.ProductView
          data={{
            products: [
              {
                id: product.id,
                title: product.title,
                price: selectedVariant?.price.amount || '0',
                vendor: product.vendor,
                variantId: selectedVariant?.id || '',
                variantTitle: selectedVariant?.title || '',
                quantity: 1,
              },
            ],
          }}
        />
      </div >
      <div className="related-products-row">
        <div className="related-products">
          <h2>Related Products</h2>
          <RelatedProductsRow products={relatedProducts || []} />
        </div>
      </div>
    </div >
  );
}


const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
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
      images(first: 30) {
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
    images(first: 30) {
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

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
/** @typedef {import('storefrontapi.generated').ProductFragment} ProductFragment */
/** @typedef {import('@shopify/hydrogen/storefront-api-types').SelectedOption} SelectedOption */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
