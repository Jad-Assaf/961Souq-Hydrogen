import { Suspense } from 'react';
import { defer, redirect } from '@shopify/remix-oxygen';
import { Await, useLoaderData } from '@remix-run/react';
import {
    getSelectedProductOptions,
    useOptimisticVariant,
} from '@shopify/hydrogen';
import { getVariantUrl } from '~/lib/variants';
import { ProductImages } from '~/components/ProductImage';
import { ProductForm } from '~/components/ProductForm';
import { ProductPrice } from '~/components/ProductPrice';

export const meta = ({ data }) => {
    return [{ title: `Hydrogen | ${data?.product?.title ?? 'Product'}` }];
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
        variables: {
            handle,
            selectedOptions: getSelectedProductOptions(request) || [],
        },
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

    return { product };
}

function loadDeferredData({ context, params }) {
    const { storefront } = context;

    const variants = storefront.query(VARIANTS_QUERY, {
        variables: { handle: params.handle },
    }).catch((error) => {
        console.error('Error loading variants:', error);
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
    const { product, variants } = useLoaderData();
    const selectedVariant = useOptimisticVariant(
        product.selectedVariant,
        variants
    );

    const { title, descriptionHtml, images } = product;

    return (
        <div className="product">
            <ProductImages images={images.edges} />
            <div className="product-main">
                <h1>{title}</h1>
                <ProductPrice
                    price={selectedVariant?.price}
                    compareAtPrice={selectedVariant?.compareAtPrice}
                />
                <br />
                <Suspense
                    fallback={
                        <ProductForm
                            product={product}
                            selectedVariant={selectedVariant}
                            variants={[]}
                        />
                    }
                >
                    <Await resolve={variants} errorElement="Problem loading variants">
                        {(data) => (
                            <ProductForm
                                product={product}
                                selectedVariant={selectedVariant}
                                variants={data?.product?.variants.nodes || []}
                            />
                        )}
                    </Await>
                </Suspense>
                <br />
                <p><strong>Description</strong></p>
                <div dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
            </div>
        </div>
    );
}
