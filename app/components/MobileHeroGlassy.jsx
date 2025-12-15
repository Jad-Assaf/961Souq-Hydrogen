import React from 'react';
import {Link} from '@remix-run/react';

export default function MobileHeroGlassy({
  mobileImageSrc,
  mobileImageSrcSet,
  alt = '',
  eyebrow,
  title,
  subtitle,
  ctaText,
  ctaTo,
  align = 'bottom', // "bottom" | "center"
}) {
  return (
    <section className="mhg" aria-label={title || 'Hero'}>
      {/* Mobile-only background image (avoids loading the big image on desktop) */}
      <picture className="mhg__bg" aria-hidden="true">
        <source
          media="(max-width: 749px)"
          srcSet={mobileImageSrcSet || mobileImageSrc}
        />
        {/* tiny placeholder for desktop so the mobile image doesn't download */}
        <img
          className="mhg__img"
          src="data:image/gif;base64,R0lGODlhAQABAAAAACw="
          alt=""
          loading="eager"
          decoding="async"
        />
      </picture>

      {/* Content layer */}
      <div className={`mhg__content mhg__content--${align}`}>
        <div className="mhg__glass">
          {eyebrow ? <p className="mhg__eyebrow">{eyebrow}</p> : null}
          {title ? <h1 className="mhg__title">{title}</h1> : null}
          {subtitle ? <p className="mhg__subtitle">{subtitle}</p> : null}

          {ctaText && ctaTo ? (
            <Link className="mhg__cta" to={ctaTo} prefetch="intent">
              {ctaText}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
