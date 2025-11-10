// app/routes/black-november.jsx
import React, {useEffect, useMemo, useState} from 'react';
import {json} from '@shopify/remix-oxygen';
import {Link, useLoaderData} from '@remix-run/react';
import {Image, Money} from '@shopify/hydrogen';

/* ----------------------------- SEO Meta ----------------------------- */
export const meta = () => [
  {title: 'Black November — Tech Deals'},
  {name: 'description', content: 'Month-long offers across top tech.'},
];

/* ---------------------------- Data Loader --------------------------- */
export async function loader({context}) {
  const {storefront} = context;
  const data = await storefront.query(COLLECTION_QUERY, {
    variables: {handle: 'black-november', first: 100},
  });

  return json({
    collection: data?.collection ?? null,
  });
}

/* --------------------------- GraphQL Query -------------------------- */
const COLLECTION_QUERY = `#graphql
  query BlackNovember($handle: String!, $first: Int!) {
    collection(handle: $handle) {
      id
      title
      handle
      products(first: $first) {
        nodes {
          id
          handle
          title
          featuredImage { id altText url width height }
          priceRange { minVariantPrice { amount currencyCode } }
          compareAtPriceRange { minVariantPrice { amount currencyCode } }
        }
      }
    }
  }
`;

/* ================================ PAGE ================================ */
export default function BlackNovemberRoute() {
  const {collection} = useLoaderData();

  const css = `
  :root{
    --bg:#070A0E; --bg-2:#0C1118;
    --ink:#DCE4F2; --muted:#8A95A7;
    --glass:rgba(255,255,255,.06);
    --ring:rgba(0,170,255,.5);
    --shadow:0 10px 30px rgba(0,0,0,.45);
  }

  .nav-bar-container{
    background: rgb(255 255 255 / 0%);
    backdrop-filter: blur(10px) saturate(2.5);
    box-shadow: 0px 2px 14px 1px black;
  }
    .nav-link{
    color: #fff;}
  *{box-sizing:border-box}
  body{background:var(--bg)}
  .bn-wrap{
    color:var(--ink);
    min-height:100%;
    background:
      radial-gradient(1200px 600px at 70% 10%, rgba(0,150,255,.12), transparent 60%),
      radial-gradient(900px 500px at 20% 45%, rgba(0,255,190,.08), transparent 70%),
      var(--bg);
    padding-bottom:56px;
  }
  .bn-container{ width:min(1200px, 92vw); margin: 0px auto; padding: 75px 0}

  /* ------------------------------ Banner ------------------------------ */
  .bn-hero{
    position:relative; border-radius:22px; overflow:hidden;
    margin:24px auto 50px;
    background:linear-gradient(180deg, #0d1218 0%, #0a0f15 100%);
  }
  .bn-hero img{
    width:100%;
    height:auto;
    filter:saturate(1.2) brightness(1.2);
  }
    @media (max-width: 768px){
    .bn-hero img{ filter: brightness(2.2); }}
  .bn-hero::after{
    content:""; position:absolute; inset:0;
    background:radial-gradient(65% 50% at 50% 100%, rgba(0,0,0,.0) 0%, rgba(0,0,0,.35) 65%, rgba(0,0,0,.55) 100%);
    pointer-events:none;
  }

  /* --------------------------- Header Row ----------------------------- */
  .bn-head{
    display:flex; align-items:center; justify-content:space-between; flex-direction:column;
    gap:12px; margin: 6px 4px 4px;
  }
  .bn-title{ font-size:26px; letter-spacing:.3px; font-weight:700;text-align:center;color:white; }
  .bn-right{ display:flex; gap:10px; align-items:center; flex-wrap:wrap; }

  .pill{
    display:inline-flex; align-items:center; gap:10px;
    padding:10px 14px; border-radius:999px;
    background:linear-gradient(180deg, var(--glass), transparent);
    border:1px solid rgba(255,255,255,.08);
    backdrop-filter: blur(8px);
    color:var(--ink); text-decoration:none; font-weight:600;
  }
  .dot{ width:8px; height:8px; border-radius:50%; background:var(--ring); box-shadow:0 0 18px var(--ring); }

  /* --------------------------- Countdown ------------------------------ */
  .counter{
    display:flex; gap:5px; align-items:center; flex-wrap:wrap;
    padding:6px 12px; border-radius:50px;
    background:linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03));
    border:1px solid rgba(255,255,255,.08);
  }
  .unit{ display:flex; align-items:baseline; gap:6px; }
  .num{
    min-width:44px; text-align:center; font-variant-numeric:tabular-nums;
    font-weight:800; font-size:20px; padding 8px; border-radius:30px;
    background:radial-gradient(120% 120% at 90% -10%, rgba(0,170,255,.20), transparent 40%), var(--bg-2);
    border:1px solid rgba(0,170,255,.25);
  }
  .lbl{ color:var(--muted); font-size:12px; letter-spacing:.2px; }

  /* ------------------------------ Grid -------------------------------- */
  .grid{ display:grid; grid-template-columns: repeat(12, 1fr); gap:clamp(12px, 2vw, 18px); }
  .cards{ margin-top: 18px; }
  .card{
    grid-column: span 6;
    background: linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02));
    border:1px solid rgba(255,255,255,.08);
    box-shadow:var(--shadow); border-radius:18px; overflow:hidden; position:relative;
    transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
  }
  @media (min-width: 720px){ .card{ grid-column: span 4 } }
  @media (min-width: 1040px){ .card{ grid-column: span 3 } }

  .card:hover{ transform: translateY(-4px); border-color: rgba(0,170,255,.25); box-shadow: 0 16px 38px rgba(0,0,0,.5)}
  .card-media{
    background: radial-gradient(120% 100% at 80% 0%, rgba(0,170,255,.12), transparent 60%), #0d131b;
    aspect-ratio: 4 / 3; display:grid; place-items:center;
  }
  .card-media img{ width:100%; height:100%; object-fit:contain; }
  .card-body{ padding:12px 14px 14px; }
  .title{
    font-size:clamp(13px, 1.4vw, 15.5px); font-weight:600; color:var(--ink);
    display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; min-height:2.6em;
  }
  .price{ margin-top:8px; display:flex; align-items:center; gap:10px; }
  .price .now{ font-weight:700; font-size:clamp(14px, 1.6vw, 16px); }
  .price .was{ color:var(--muted); text-decoration:line-through; font-size:13px; }

  .badgee{
    position:absolute; top:3px; left:3px; padding:6px 9px; border-radius:16px;
    background:#fff;
    border:1px solid rgba(0,170,255,.35); color:deepskyblue; font-weight:500; font-size:12px; letter-spacing:.3px;
    backdrop-filter: blur(20px);
    mix-blend-mode: difference;
  }

  /* --------------------------- Empty State --------------------------- */
  .empty{
    margin: 22px auto 0; padding: 18px; border-radius: 14px;
    background: linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02));
    border:1px solid rgba(255,255,255,.08); color: var(--muted);
  }
    /* Show/Hide helpers */
    .only-mobile { display:block; }
    .only-desktop { display:none; }
    @media (min-width: 768px){
    .only-mobile { display:none !important; }
    .only-desktop { display:block !important; }
    .search-bar{border:1px solid #fff !important;} 
    }
    .search-container svg {stroke: #fff !important;}
    .header-ctas .wishlist-icon svg *,.header-ctas .sign-in-link svg *, .cart-button svg {fill: #fff !important;}
    .header .mobile-menu-toggle svg *{ stroke:#fff !important; }
    .footer{ background: var(--bg-2) !important; border-top: 1px solid rgba(255,255,255,.08) !important; }
    .footer-column ul li a, .footer-column h3{ color:#fff !important; }
    li i svg *{ fill:#fff !important; }
    .social-links *{ background:#fff !important;color:#000 !important; }
    .social-links a svg *{ fill:#000 !important; }
    .copyright{background:var(--bg-2) !important;}
    @media (max-width: 1024px){
    .search-bar-submit, .search-bar, .header {background: transparent !important; border: none !important;}
    .header{backdrop-filter: blur(15px) saturate(1.5);}
    .header-top{ padding: 35px 0 81px !important}
    .main-search {box-shadow: rgb(0 0 0 / 23%) 0px 8px 7px 0px !important;}
    }
  `;

  return (
    <main className="bn-wrap">
      <style dangerouslySetInnerHTML={{__html: css}} />

      <section className="bn-container">
        {/* Banner: robust switch with <picture>. 
           - Mobile first (<=767px) uses mobile image
           - Fallback <img> is desktop */}
        <h1 className="bn-title">Black November</h1>
        <div className="bn-hero">
          {/* Mobile banner */}
          <img
            className="only-mobile"
            src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/ChatGPT_Image_Nov_5_2025_10_45_04_AM.png?v=1762332317"
            alt="Black November tech banner (mobile)"
            width={1600}
            height={700}
            loading="eager"
            decoding="async"
            fetchpriority="high"
          />
          {/* Desktop banner */}
          <img
            className="only-desktop"
            src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/ChatGPT_Image_Nov_5_2025_10_45_03_AM.png?v=1762332317"
            alt="Black November tech banner (desktop)"
            width={1600}
            height={700}
            loading="eager"
            decoding="async"
            fetchpriority="high"
          />
        </div>

        <div className="bn-head">
          <div className="bn-right">
            <span className="pill">
              <span className="dot" /> Month-long offers
            </span>
            {/* Removed the “Shop collection” button per request */}
            <CountdownBar />
          </div>
        </div>

        {collection?.products?.nodes?.length ? (
          <>
            <div className="grid cards">
              {collection.products.nodes.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </>
        ) : (
          <div className="empty">
            Create a collection with handle <code>black-november</code> to
            auto-list items here. The banner and timer display regardless.
          </div>
        )}
      </section>
    </main>
  );
}

/* ========================== Helper Components ========================== */
function ProductCard({product}) {
  const fi = product.featuredImage;
  const onSale = hasDiscount(product);
  const discountPct = onSale ? computeDiscountPct(product) : null;

  return (
    <article className="card">
      {onSale ? <div className="badgee">-{discountPct}%</div> : null}
      <Link
        prefetch="intent"
        to={`/products/${product.handle}`}
        style={{display: 'block'}}
      >
        <div className="card-media">
          {fi ? (
            <Image
              data={fi}
              sizes="(min-width: 1040px) 25vw, (min-width: 720px) 33vw, 50vw"
              alt={fi.altText ?? product.title}
              loading="lazy"
            />
          ) : (
            <img alt={product.title} src="" />
          )}
        </div>
        <div className="card-body">
          <div className="title">{product.title}</div>
          <div className="price">
            <span className="now">
              <Money data={product.priceRange.minVariantPrice} />
            </span>
            {onSale ? (
              <span className="was">
                <Money data={product.compareAtPriceRange.minVariantPrice} />
              </span>
            ) : null}
          </div>
        </div>
      </Link>
    </article>
  );
}

function hasDiscount(p) {
  const now = p?.priceRange?.minVariantPrice;
  const was = p?.compareAtPriceRange?.minVariantPrice;
  if (!now || !was) return false;
  const n = Number(now.amount);
  const w = Number(was.amount);
  return isFinite(n) && isFinite(w) && w > n;
}
function computeDiscountPct(p) {
  const now = Number(p.priceRange.minVariantPrice.amount);
  const was = Number(p.compareAtPriceRange.minVariantPrice.amount);
  if (!isFinite(now) || !isFinite(was) || was <= 0) return 0;
  return Math.max(1, Math.round(((was - now) / was) * 100));
}

/* ---------------------------- Countdown Bar --------------------------- */
function CountdownBar() {
  // Target: end of current November at 23:59:59 local time
  const target = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    // Month index: 10 = November
    return new Date(year, 10, 30, 23, 59, 59, 999);
  }, []);

  const [left, setLeft] = useState(getLeft(target));

  useEffect(() => {
    const id = setInterval(() => setLeft(getLeft(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (left.total <= 0) {
    return <span className="pill">Sale ended</span>;
  }

  return (
    <div className="counter" role="timer" aria-live="polite">
      <TimeUnit n={left.days} label="days" />
      <TimeUnit n={left.hours} label="hrs" />
      <TimeUnit n={left.minutes} label="min" />
      <TimeUnit n={left.seconds} label="sec" />
    </div>
  );
}

function TimeUnit({n, label}) {
  const v = String(n).padStart(2, '0');
  return (
    <div className="unit">
      <span className="num">{v}</span>
      <span className="lbl">{label}</span>
    </div>
  );
}

function getLeft(target) {
  const now = new Date().getTime();
  const end = target.getTime();
  const total = Math.max(0, end - now);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((total / (1000 * 60)) % 60);
  const seconds = Math.floor((total / 1000) % 60);
  return {total, days, hours, minutes, seconds};
}
