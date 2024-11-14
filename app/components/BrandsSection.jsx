import React from "react";
import '../styles/BrandsSection.css'

export const BrandSection = ({ brands }) => {
    return (
        <section className="brand-section">
            <div className="container">
                <div className="brand-grid">
                    {brands.map((brand, index) => (
                        <a key={index} href={brand.link} className="brand-item">
                            <img src={brand.image} alt={brand.name} />
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default BrandSection;
