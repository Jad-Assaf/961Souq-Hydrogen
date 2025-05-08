import React, {useRef} from 'react';
import {useInView} from 'react-intersection-observer';
import '../styles/BrandsSection.css';

export default function BrandSection({brands}) {
  const {ref, inView} = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const gridRef = useRef(null);
  const scrollGrid = (distance) => {
    gridRef.current?.scrollBy({left: distance, behavior: 'smooth'});
  };

  return (
    <section className="brand-section" ref={ref}>
      <h2>Shop By Brand</h2>

      <button
        className="circle-prev-button"
        onClick={() => scrollGrid(-600)}
        aria-label="Previous"
      >
        <CustomLeftArrow />
      </button>

      <div
        className={`brand-grid ${inView ? 'visible' : 'hidden'}`}
        ref={gridRef}
      >
        {brands.map((brand, index) => (
          <a
            key={index}
            href={brand.link}
            className={`brand-item ${inView ? 'visible' : 'hidden'}`}
          >
            <img
              src={`${brand.image}&width=150`}
              alt={brand.name}
              width={125}
              height={125}
              className="brand-image"
              loading="lazy"
            />
          </a>
        ))}
      </div>

      <button
        className="circle-next-button"
        onClick={() => scrollGrid(600)}
        aria-label="Next"
      >
        <CustomRightArrow />
      </button>
    </section>
  );
}

const CustomLeftArrow = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const CustomRightArrow = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
