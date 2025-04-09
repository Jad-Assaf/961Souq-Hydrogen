'use client';

import {useEffect, useRef} from 'react';

export default function ScrollingSVGs() {
  const scrollRef = useRef(null);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let scrollSpeed = 1; // Adjust speed if needed

    const scroll = () => {
      if (scrollContainer) {
        scrollContainer.scrollLeft += scrollSpeed;
        // Once it reaches the end of the first set of images, reset to start (seamless)
        if (scrollContainer.scrollLeft >= scrollContainer.scrollWidth / 2) {
          scrollContainer.scrollLeft = 0;
        }
      }
      requestAnimationFrame(scroll);
    };

    scroll();
  }, []);

  return (
    <div className="scrolling-container">
      <h2 className="scrolling-title">
        {' '}
        <a href="/build-your-own-desktop">Gaming PC Builder</a>
      </h2>
      <div className="scrolling-wrapper">
        <div ref={scrollRef} className="scrolling-content">
          <a href="/build-your-own-desktop" className="scrolling-item">
            <img
              loading="lazy"
              width={75}
              height={75}
              src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/56789-600x600_copy.webp?v=1744193136&quality=7.5"
              alt=""
            />
            <img
              loading="lazy"
              width={75}
              height={75}
              src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/1691936722_MX360-01.webp?v=1742897747&quality=7.5"
              alt=""
            />
            <img
              loading="lazy"
              width={75}
              height={75}
              src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/h525.png?v=1742897747&quality=7.5"
              alt=""
            />
            <img
              loading="lazy"
              width={75}
              height={75}
              src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/msi-mpg_z490_gaming_carbon_wifi-3d2_rgb.png?v=1742897747&quality=7.5"
              alt=""
            />
            <img
              loading="lazy"
              width={75}
              height={75}
              src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/ae-odyssey-neo-g9-g95nc-ls57cg952nmxue-541731703.avif?v=1742894737&quality=7.5"
              alt=""
            />
            <img
              loading="lazy"
              width={75}
              height={75}
              src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/1_20056133-8634-45c7-9bcf-cdbd887ef3b2.webp?v=1742897747&quality=7.5"
              alt=""
            />
            <img
              loading="lazy"
              width={75}
              height={75}
              src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/a99efcd10f1f4d27857cbbedab954261.png.1400x1120_q100_crop-fit_optimize.png?v=1742897748&quality=7.5"
              alt=""
            />
            <img
              loading="lazy"
              width={75}
              height={75}
              src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/8e6a81d97c124f0aa0da84099e0419c7.png.500x400_q100_crop-fit_optimize.png?v=1742897748&quality=7.5"
              alt=""
            />
            <img
              loading="lazy"
              width={75}
              height={75}
              src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/png-transparent-intel-core-xeon-cpu-socket-land-grid-array-intel-text-rectangle-trademark-thumbnail.png?v=1742897747&quality=7.5"
              alt=""
            />
            <img
              loading="lazy"
              width={75}
              height={75}
              src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/qck_prism_4xl_buyimg_02.png__1920x1080_crop-fit_optimize_subsampling-2.png?v=1742897748&quality=7.5"
              alt=""
            />
            <img
              loading="lazy"
              width={75}
              height={75}
              src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/FURY_Beast_White_RGB_DDR5_2_angle-zm-lg.png?v=1742897748&quality=7.5"
              alt=""
            />
            <img
              loading="lazy"
              width={75}
              height={75}
              src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/GM850W__55109_copy.webp?v=1744192941&quality=7.5"
              alt=""
            />
            <img
              loading="lazy"
              width={75}
              height={75}
              src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/2037.png?v=1742897748&quality=7.5"
              alt=""
            />
            <img
              loading="lazy"
              width={75}
              height={75}
              src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Terminator-02.png?v=1742897748&quality=7.5"
              alt=""
            />
            <img
              loading="lazy"
              width={75}
              height={75}
              src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/1920_high-resolution-png-progamingkeyboardbty1us.png?v=1742897748&quality=7.5"
              alt=""
            />
            <img
              loading="lazy"
              width={75}
              height={75}
              src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/kv-img.png?v=1742897748&quality=7.5"
              alt=""
            />
          </a>
          {/* Duplicate the images below to make it seamless */}
          <a href="/build-your-own-desktop" className="scrolling-item">
            <img
              loading="lazy"
              width={75}
              height={75}
              src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/56789-600x600_copy.webp?v=1744193136&quality=7.5"
              alt=""
            />
            <img
              loading="lazy"
              width={75}
              height={75}
              src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/1691936722_MX360-01.webp?v=1742897747&quality=7.5"
              alt=""
            />
            <img
              loading="lazy"
              width={75}
              height={75}
              src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/h525.png?v=1742897747&quality=7.5"
              alt=""
            />
            <img
              loading="lazy"
              width={75}
              height={75}
              src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/msi-mpg_z490_gaming_carbon_wifi-3d2_rgb.png?v=1742897747&quality=7.5"
              alt=""
            />
            <img
              loading="lazy"
              width={75}
              height={75}
              src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/ae-odyssey-neo-g9-g95nc-ls57cg952nmxue-541731703.avif?v=1742894737&quality=7.5"
              alt=""
            />
            <img
              loading="lazy"
              width={75}
              height={75}
              src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/1_20056133-8634-45c7-9bcf-cdbd887ef3b2.webp?v=1742897747&quality=7.5"
              alt=""
            />
            <img
              loading="lazy"
              width={75}
              height={75}
              src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/a99efcd10f1f4d27857cbbedab954261.png.1400x1120_q100_crop-fit_optimize.png?v=1742897748&quality=7.5"
              alt=""
            />
            <img
              loading="lazy"
              width={75}
              height={75}
              src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/8e6a81d97c124f0aa0da84099e0419c7.png.500x400_q100_crop-fit_optimize.png?v=1742897748&quality=7.5"
              alt=""
            />
            <img
              loading="lazy"
              width={75}
              height={75}
              src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/png-transparent-intel-core-xeon-cpu-socket-land-grid-array-intel-text-rectangle-trademark-thumbnail.png?v=1742897747&quality=7.5"
              alt=""
            />
            <img
              loading="lazy"
              width={75}
              height={75}
              src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/qck_prism_4xl_buyimg_02.png__1920x1080_crop-fit_optimize_subsampling-2.png?v=1742897748&quality=7.5"
              alt=""
            />
            <img
              loading="lazy"
              width={75}
              height={75}
              src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/FURY_Beast_White_RGB_DDR5_2_angle-zm-lg.png?v=1742897748&quality=7.5"
              alt=""
            />
            <img
              loading="lazy"
              width={75}
              height={75}
              src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/GM850W__55109_copy.webp?v=1744192941&quality=7.5"
              alt=""
            />
            <img
              loading="lazy"
              width={75}
              height={75}
              src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/2037.png?v=1742897748&quality=7.5"
              alt=""
            />
            <img
              loading="lazy"
              width={75}
              height={75}
              src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Terminator-02.png?v=1742897748&quality=7.5"
              alt=""
            />
            <img
              loading="lazy"
              width={75}
              height={75}
              src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/1920_high-resolution-png-progamingkeyboardbty1us.png?v=1742897748&quality=7.5"
              alt=""
            />
            <img
              loading="lazy"
              width={75}
              height={75}
              src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/kv-img.png?v=1742897748&quality=7.5"
              alt=""
            />
          </a>
        </div>
      </div>
    </div>
  );
}
