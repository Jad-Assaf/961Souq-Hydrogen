// CategorySlider.jsx
import { Link } from '@remix-run/react';
import { Image } from '@shopify/hydrogen-react';
import { motion, useInView } from 'framer-motion';
import React, { useRef } from 'react';

export const CategorySlider = ({ sliderCollections }) => {
    return (
        <div className="slide-con">
            <h3 className="cat-h3">Shop By Categories</h3>
            <div className="category-slider">
                {sliderCollections.map((collection, index) => (
                    <CategoryItem key={collection.id} collection={collection} index={index} />
                ))}
            </div>
        </div>
    );
};

function CategoryItem({ collection, index }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: index * 0.01, duration: 0.5 }}
            className="category-container"
        >
            <Link to={`/collections/${collection.handle}`}>
                <motion.div
                    initial={{ filter: 'blur(10px)', opacity: 0 }}
                    animate={isInView ? { filter: 'blur(0px)', opacity: 1 } : {}}
                    transition={{ duration: 0.5 }}
                    width="150px"
                    height="150px"
                >
                    <Image
                        data={collection.image}
                        aspectRatio="1/1"
                        sizes="(min-width: 45em) 20vw, 40vw"
                        srcSet={`${collection.image?.url}?width=300&quality=30 300w,
                                 ${collection.image?.url}?width=600&quality=30 600w,
                                 ${collection.image?.url}?width=1200&quality=30 1200w`}
                        alt={collection.image?.altText || collection.title}
                        className="category-image"
                        width="150px"
                        height="150px"
                    />
                </motion.div>
                <div className="category-title">{collection.title}</div>
            </Link>
        </motion.div>
    );
}