import {Link} from '@remix-run/react';

/**
 * PNGs location: app/assets/
 * We resolve URLs via Vite's import.meta.glob.
 */
const files = import.meta.glob('../assets/*.{png,PNG}', {
  eager: true,
  as: 'url',
});
const assetUrlsBySlug = Object.fromEntries(
  Object.entries(files).map(([path, url]) => {
    const file = (path.split('/').pop() || '').toLowerCase();
    const slug = file.replace(/\.png$/i, '');
    return [slug, url];
  }),
);

export default function CategoryTiles({title = 'Shop by Category'}) {
  const items = [
    // Your requested gradient pairs:
    {label: 'Apple', slug: 'apple', start: '#8BD5E6', end: '#818FDD'},
    {label: 'Gaming', slug: 'gaming', start: '#80AEFE', end: '#9E79FD'},
    {label: 'Laptops', slug: 'laptops', start: '#88A9EB', end: '#475EB6'},
    {label: 'Desktops', slug: 'desktops', start: '#F6B2FE', end: '#7947DA'},
    {label: 'PC Parts', slug: 'pc-parts', start: '#F4BD40', end: '#F4BD40'}, // flat by design
    {label: 'Networking', slug: 'networking', start: '#7BD2F4', end: '#2C75E5'},
    {label: 'Monitors', slug: 'monitors', start: '#F7B7E0', end: '#8666B7'},
    {label: 'Mobiles', slug: 'mobiles', start: '#4CC8E9', end: '#1273BB'},

    // Others unchanged:
    {label: 'Tablets', slug: 'tablets', start: '#8dbb97', end: '#6f9274'},
    {label: 'Audio', slug: 'audio', start: '#ffd866', end: '#f67b3b'},
    {
      label: 'Accessories',
      slug: 'accessories',
      start: '#71cbf5',
      end: '#1593e3',
    },
    {label: 'Fitness', slug: 'fitness', start: '#bbe204', end: '#6db300'},
    {
      label: 'Photography',
      slug: 'photography',
      start: '#e08332',
      end: '#f29759',
    },
    {
      label: 'Home Appliances',
      slug: 'home-appliances',
      start: '#38a8eeff',
      end: '#107ac6ff',
    },
  ];

  return (
    <section className="catSection" aria-labelledby="catTitle">
      <h2 id="catTitle" className="catTitle">
        {title}
      </h2>

      <div className="catList">
        {items.map((item) => {
          const handle = item.slug;
          const modelUrl = assetUrlsBySlug[item.slug] || '';

          return (
            <Link
              key={item.slug}
              to={`/collections/${handle}`}
              className="catCard"
              aria-label={`Browse ${item.label}`}
              style={{
                '--start': item.start,
                '--end': item.end,
              }}
              data-missing={!modelUrl || undefined}
              prefetch="intent"
            >
              <span className="catLabel">{item.label}</span>

              {/* IMAGE ELEMENT inside the slot (no background-image) */}
              <span
                className="catModel"
                aria-hidden="true"
                style={{'--model': modelUrl ? `url("${modelUrl}")` : 'none'}}
              >
                {modelUrl ? (
                  <img
                    className="catImg"
                    src={modelUrl}
                    alt=""
                    decoding="async"
                    loading="lazy"
                  />
                ) : null}
              </span>
            </Link>
          );
        })}
      </div>

      <style>{`
        .catSection { margin: 20px 16px 8px; }
        .catTitle { margin: 0 4px 16px; font-size: 20px; font-weight: 700; color: #0F172A; letter-spacing: -0.02em; }

        .catList {
          display: grid;
          grid-template-columns: 1fr;
          gap: 40px;
          overflow: visible;
        }

        .catCard {
          position: relative;
            display: flex;
            align-items: end;
            height: 95px;
            padding: 0 18px 10px;
            border-radius: 10px;
            background: linear-gradient(170deg, var(--start), var(--end));
            color: #fff;
            text-decoration: none;
            box-shadow: 0 10px 28px rgba(0, 0, 0, .10);
            overflow: visible;
            isolation: isolate;
            -webkit-tap-highlight-color: transparent;
            transition: transform .15s ease, box-shadow .15s ease;
            will-change: transform;
        }
        .catCard:active { transform: translateY(1px) scale(0.995); }
        @media (hover:hover){ .catCard:hover { box-shadow: 0 14px 34px rgba(0,0,0,.14); } }

        .catLabel {
          font-size: 20px;
          font-weight: 500;
          letter-spacing: -0.01em;
          text-shadow: 0 1px 1px rgba(0,0,0,.18);
          z-index: 2;
        }

        /* Soft highlight + bottom shade for readability */
        .catCard::before {
          content:"";
          position:absolute; inset:0; border-radius:10px; pointer-events:none;
          background:
            radial-gradient(120% 120% at 12% -10%, rgba(255,255,255,.28) 0%, rgba(255,255,255,0) 38%),
            linear-gradient(180deg, rgba(0,0,0,0) 62%, rgba(0,0,0,.18) 100%);
        }

        /* Model container (holds the <img> and the gradient overlay mask) */
        .catModel {
          position: absolute;
          right: 30px;
          bottom: 10px;
          width: 115px;
          height: 100px;
          pointer-events: none;
          z-index: 1;
        }

        .catImg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
          object-position: right bottom;
          filter: drop-shadow(3px 2px 2px rgb(from var(--start) r g b / 0.6));
        }

        /* Gradient overlay tinted ONLY where the PNG is opaque */
        // .catModel::after {
        //   content: "";
        //   position: absolute;
        //   inset: 0;
        //   background: linear-gradient(135deg, var(--start), var(--end));
        //   opacity: 0.80;
        //   mix-blend-mode: multiply;

        //   /* Mask confines the gradient to the model silhouette */
        //   -webkit-mask-image: var(--model);
        //   mask-image: var(--model);
        //   -webkit-mask-repeat: no-repeat;
        //   mask-repeat: no-repeat;
        //   -webkit-mask-size: contain;
        //   mask-size: contain;
        //   -webkit-mask-position: right bottom;
        //   mask-position: right bottom;
        //   pointer-events: none;
        // }

        /* Fallback if a PNG is missing */
        .catCard[data-missing] .catModel::after { display: none; }
      `}</style>
    </section>
  );
}
