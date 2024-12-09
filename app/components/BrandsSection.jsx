import React from "react";
import { Image } from "@shopify/hydrogen"; // Import the Shopify Image component
import { motion } from 'framer-motion';
import "../styles/BrandsSection.css";

export const BrandSection = ({ brands }) => {
    return (
        <section className="brand-section">
            <h2>Shop By Brand</h2>
            <motion.div
                className="brand-grid"
                initial="hidden"
                animate="visible"
                variants={{
                    hidden: {
                        opacity: 0,
                        y: 20,
                    },
                    visible: {
                        opacity: 1,
                        y: 0,
                        transition: {
                            staggerChildren: 0.1, // Adds a stagger effect to child elements
                        },
                    },
                }}
            >
                {brands.map((brand, index) => (
                    <motion.a
                        key={index}
                        href={brand.link}
                        className="brand-item"
                        variants={{
                            hidden: { opacity: 0, scale: 0.9 },
                            visible: { opacity: 1, scale: 1 },
                        }}
                        transition={{ duration: 0.5 }}
                    >
                        <Image
                            data={{
                                altText: brand.name, // Use the brand name as alt text
                                url: brand.image,    // URL of the brand image
                            }}
                            width="150px" // Set a reasonable width for brand logos
                            height="auto" // Set a reasonable height for brand logos
                            sizes="(min-width: 45em) 10vw, 20vw" // Responsive sizes
                        />
                    </motion.a>
                ))}
            </motion.div>
        </section>
    );
};
