import React from "react";
import { Image } from "@shopify/hydrogen"; // Import the Shopify Image component
import "../styles/BrandsSection.css";

export const BrandSection = ({ brands }) => {
    return (
        <section className="brand-section">
            <h3>Shop By Brand</h3>
            <div className="brand-grid">
                {brands.map((brand, index) => (
                    <a key={index} href={brand.link} className="brand-item">
                        <Image
                            data={{
                                altText: brand.name, // Use the brand name as alt text
                                url: brand.image,    // URL of the brand image
                            }}
                            width="150px" // Set a reasonable width for brand logos
                            height="auto" // Set a reasonable height for brand logos
                            sizes="(min-width: 45em) 10vw, 20vw" // Responsive sizes
                        />
                    </a>
                ))}
            </div>
        </section>
    );
};
