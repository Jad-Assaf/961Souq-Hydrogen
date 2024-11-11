// ProductItem.jsx
import React, { useRef, useEffect, useState } from 'react';
import { Link } from '@remix-run/react';
import { Money, Image } from '@shopify/hydrogen';
import { motion, useInView, useAnimation } from 'framer-motion';
import { AddToCartButton } from '~/components/AddToCartButton';
import { useAside } from '~/components/Aside';
import { truncateText } from '~/components/CollectionDisplay';

export function ProductItem({ product, index, numberInRow = 4 }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '0px 0px 100px 0px' });
    const controls = useAnimation();
    const { open } = useAside();

    const selectedVariant = product.variants.nodes.find(variant => variant.availableForSale) || product.variants.nodes[0];
    const hasVariants = product.variants.nodes.length > 1;
    const [isImageLoaded, setIsImageLoaded] = useState(false);

    useEffect(() => {
        if (isInView) {
            controls.start("visible");
        }
    }, [isInView, controls]);

    const rowIndex = Math.floor(index / numberInRow);
    const columnIndex = index % numberInRow;
    const delay = rowIndex * 0.3 + columnIndex * 0.1;

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, x: -30 }}
            animate={controls}
            variants={{
                visible: {
                    opacity: 1,
                    x: 0,
                    transition: { delay, duration: 0.5 }
                }
            }}
            className="product-item"
        >
            <Link to={`/products/${product.handle}`}>
                <motion.div
                    initial={{ filter: 'blur(10px)', opacity: 0 }}
                    animate={{ filter: isImageLoaded ? 'blur(0px)' : 'blur(10px)', opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="product-card"
                >
                    <Image
                        data={product.images.nodes[0]}
                        aspectRatio="1/1"
                        sizes="(min-width: 45em) 20vw, 40vw"
                        srcSet={`${product.images.nodes[0].url}?width=300&quality=30 300w,
                                 ${product.images.nodes[0].url}?width=600&quality=30 600w,
                                 ${product.images.nodes[0].url}?width=1200&quality=30 1200w`}
                        alt={product.images.nodes[0].altText || 'Product Image'}
                        width="180px"
                        height="180px"
                        onLoad={() => setIsImageLoaded(true)}
                    />
                    <h4>{truncateText(product.title, 50)}</h4>
                    <div className="product-price">
                        <Money data={selectedVariant.price} />
                    </div>
                </motion.div>
            </Link>

            <AddToCartButton
                disabled={!selectedVariant || !selectedVariant.availableForSale}
                onClick={() => {
                    if (hasVariants) {
                        window.location.href = `/products/${product.handle}`;
                    } else {
                        open('cart');
                    }
                }}
                lines={
                    selectedVariant && !hasVariants
                        ? [
                            {
                                merchandiseId: selectedVariant.id,
                                quantity: 1,
                                product: {
                                    ...product,
                                    selectedVariant,
                                    handle: product.handle,
                                },
                            },
                        ]
                        : []
                }
            >
                {!selectedVariant?.availableForSale
                    ? 'Sold out'
                    : hasVariants
                        ? 'Select Options'
                        : 'Add to cart'}
            </AddToCartButton>
        </motion.div>
    );
}

export default ProductItem;
