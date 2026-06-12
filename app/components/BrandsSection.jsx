import React, {useEffect, useRef, useState} from 'react';

export default function BrandSection({brands}) {
  const sectionRef = useRef(null);
  const gridRef = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node || inView) return;

    if (
      typeof window === 'undefined' ||
      !('IntersectionObserver' in window)
    ) {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      {threshold: 0.1},
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [inView]);

  const scrollGrid = (distance) => {
    gridRef.current?.scrollBy({left: distance, behavior: 'smooth'});
  };

  return (
    <section className="brand-section" ref={sectionRef}>
      <h2>Shop By Brand</h2>

      <button
        className="home-prev-button"
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
              src={`${brand.image}&format=webp&width=100`}
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
        className="home-next-button"
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
