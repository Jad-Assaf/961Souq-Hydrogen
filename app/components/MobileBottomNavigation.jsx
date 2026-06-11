import React, {useEffect, useMemo, useRef, useState} from 'react';
import {NavLink, useLocation} from 'react-router';
import {useAside} from '~/components/Aside';
import {useWishlist} from '~/lib/WishlistContext';
import {ChatbotIcon, STOREFRONT_CHATBOT_OPEN_EVENT} from './chatbotShared';

const MOBILE_NAV_FROSTED_MAP = '/mobile-nav-frosted-map.png';

export default function MobileBottomNavigation({cart}) {
  const {open} = useAside();
  const {items} = useWishlist();
  const location = useLocation();
  const [isSupportMenuOpen, setIsSupportMenuOpen] = useState(false);
  const supportMenuRef = useRef(null);

  /* ---------------------------------------------------------------
     Derive quantity from ANY cart shape
  ----------------------------------------------------------------*/
  const itemCount = useMemo(() => {
    if (!cart) return 0;

    if (typeof cart.totalQuantity === 'number') return cart.totalQuantity;

    if (Array.isArray(cart.lines)) {
      return cart.lines.reduce((sum, l) => sum + (l.quantity ?? 0), 0);
    }

    if (Array.isArray(cart.lines?.edges)) {
      return cart.lines.edges.reduce(
        (sum, edge) => sum + (edge?.node?.quantity ?? 0),
        0,
      );
    }

    if (Array.isArray(cart.items)) {
      return cart.items.reduce((sum, i) => sum + (i.quantity ?? 0), 0);
    }

    return 0;
  }, [cart]);

  /* ---------------------------------------------------------------
     Wishlist count (from WishlistContext)
  ----------------------------------------------------------------*/
  const wishCount = useMemo(
    () => (Array.isArray(items) ? items.length : 0),
    [items],
  );

  useEffect(() => {
    setIsSupportMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isSupportMenuOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!supportMenuRef.current?.contains(event.target)) {
        setIsSupportMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsSupportMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSupportMenuOpen]);

  const openChatbot = () => {
    setIsSupportMenuOpen(false);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(STOREFRONT_CHATBOT_OPEN_EVENT));
    }
  };

  return (
    <>
      <svg
        className="mobile-nav-frosted-defs"
        aria-hidden="true"
        focusable="false"
      >
        <filter id="mobile-nav-frosted" primitiveUnits="objectBoundingBox">
          <feImage
            href={MOBILE_NAV_FROSTED_MAP}
            x="0"
            y="0"
            width="1"
            height="1"
            result="map"
          />
          <feGaussianBlur
            in="SourceGraphic"
            stdDeviation="0.02"
            result="blur"
          />
          <feDisplacementMap
            in="blur"
            in2="map"
            scale="1"
            xChannelSelector="R"
            yChannelSelector="G"
          >
            <animate
              attributeName="scale"
              to="1.4"
              dur="0.3s"
              begin="mobile-bottom-nav.mouseover;mobile-bottom-nav.touchstart"
              fill="freeze"
            />
            <animate
              attributeName="scale"
              to="1"
              dur="0.3s"
              begin="mobile-bottom-nav.mouseout;mobile-bottom-nav.touchend"
              fill="freeze"
            />
          </feDisplacementMap>
        </filter>
      </svg>

      <nav id="mobile-bottom-nav" className="mobile-bottom-nav">
        <NavLink to="/" className="nav-item" aria-label="Homepage Button" end>
          <HomeIcon />
        </NavLink>

        <NavLink to="/wishlist" aria-label="Wishlist Page" className="nav-item">
          <WishListIcon />
          {wishCount > 0 && <span className="badge">{wishCount}</span>}
        </NavLink>

        <NavLink
          to="/account"
          className="nav-item"
          aria-label="User Account Button"
          target="_blank"
          rel="noreferrer noopener"
        >
          <UserIcon />
        </NavLink>

        <div className="mobile-support-nav" ref={supportMenuRef}>
          {isSupportMenuOpen && (
            <div className="mobile-support-menu" role="menu">
              <button
                type="button"
                className="mobile-support-menu__action"
                onClick={openChatbot}
                role="menuitem"
              >
                <span className="mobile-support-menu__icon mobile-support-menu__icon--chat">
                  <ChatbotIcon />
                </span>
                <span className="mobile-support-menu__label">Ask AI</span>
              </button>

              <a
                href="https://wa.me/96170961961"
                target="_blank"
                rel="noreferrer"
                className="mobile-support-menu__action"
                role="menuitem"
                onClick={() => setIsSupportMenuOpen(false)}
              >
                <span className="mobile-support-menu__icon mobile-support-menu__icon--whatsapp">
                  <WhatsappIcon />
                </span>
                <span className="mobile-support-menu__label">WhatsApp</span>
              </a>
            </div>
          )}

          <button
            type="button"
            className={`nav-item mobile-support-toggle${
              isSupportMenuOpen ? ' is-active' : ''
            }`}
            aria-label="Open support options"
            aria-haspopup="menu"
            aria-expanded={isSupportMenuOpen}
            onClick={() => setIsSupportMenuOpen((previous) => !previous)}
          >
            <ChatbotIcon />
          </button>
        </div>

        <button
          className="nav-item cart-toggle"
          aria-label="Open Cart"
          onClick={() => open('cart')}
        >
          <CartIcon />
          {itemCount > 0 && <span className="badge">{itemCount}</span>}
        </button>
      </nav>
    </>
  );
}

/* ----------------------------- ICONS ----------------------------- */

function HomeIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="-7.2 -7.2 38.40 38.40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      transform="matrix(-1, 0, 0, 1, 0, 0)"
    >
      <g id="SVGRepo_bgCarrier" strokeWidth="0">
        <rect
          x="-7.2"
          y="-7.2"
          width="38.40"
          height="38.40"
          rx="19.2"
          fill="#ffffff57"
          strokeWidth="0"
        ></rect>
      </g>
      <g
        id="SVGRepo_tracerCarrier"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="#ffffff57"
        strokeWidth="0.096"
      ></g>
      <g id="SVGRepo_iconCarrier">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12.2796 3.71579C12.097 3.66261 11.903 3.66261 11.7203 3.71579C11.6678 3.7311 11.5754 3.7694 11.3789 3.91817C11.1723 4.07463 10.9193 4.29855 10.5251 4.64896L5.28544 9.3064C4.64309 9.87739 4.46099 10.0496 4.33439 10.24C4.21261 10.4232 4.12189 10.6252 4.06588 10.8379C4.00765 11.0591 3.99995 11.3095 3.99995 12.169V17.17C3.99995 18.041 4.00076 18.6331 4.03874 19.0905C4.07573 19.536 4.14275 19.7634 4.22513 19.9219C4.41488 20.2872 4.71272 20.5851 5.07801 20.7748C5.23658 20.8572 5.46397 20.9242 5.90941 20.9612C6.36681 20.9992 6.95893 21 7.82995 21H7.99995V18C7.99995 15.7909 9.79081 14 12 14C14.2091 14 16 15.7909 16 18V21H16.17C17.041 21 17.6331 20.9992 18.0905 20.9612C18.5359 20.9242 18.7633 20.8572 18.9219 20.7748C19.2872 20.5851 19.585 20.2872 19.7748 19.9219C19.8572 19.7634 19.9242 19.536 19.9612 19.0905C19.9991 18.6331 20 18.041 20 17.17V12.169C20 11.3095 19.9923 11.0591 19.934 10.8379C19.878 10.6252 19.7873 10.4232 19.6655 10.24C19.5389 10.0496 19.3568 9.87739 18.7145 9.3064L13.4748 4.64896C13.0806 4.29855 12.8276 4.07463 12.621 3.91817C12.4245 3.7694 12.3321 3.7311 12.2796 3.71579ZM11.1611 1.79556C11.709 1.63602 12.2909 1.63602 12.8388 1.79556C13.2189 1.90627 13.5341 2.10095 13.8282 2.32363C14.1052 2.53335 14.4172 2.81064 14.7764 3.12995L20.0432 7.81159C20.0716 7.83679 20.0995 7.86165 20.1272 7.88619C20.6489 8.34941 21.0429 8.69935 21.3311 9.13277C21.5746 9.49916 21.7561 9.90321 21.8681 10.3287C22.0006 10.832 22.0004 11.359 22 12.0566C22 12.0936 22 12.131 22 12.169V17.212C22 18.0305 22 18.7061 21.9543 19.2561C21.9069 19.8274 21.805 20.3523 21.5496 20.8439C21.1701 21.5745 20.5744 22.1701 19.8439 22.5496C19.3522 22.805 18.8274 22.9069 18.256 22.9543C17.706 23 17.0305 23 16.2119 23H15.805C15.6603 23 15.5157 23.0001 15.3883 22.9895C15.2406 22.9773 15.0292 22.9458 14.8085 22.8311C14.5345 22.6888 14.3111 22.4654 14.1688 22.1915C14.0542 21.9707 14.0227 21.7593 14.0104 21.6116C13.9998 21.4843 13.9999 21.3396 13.9999 21.2185L14 18C14 16.8954 13.1045 16 12 16C10.8954 16 9.99995 16.8954 9.99995 18L9.99996 21.2185C10 21.3396 10.0001 21.4843 9.98949 21.6116C9.97722 21.7593 9.94572 21.9707 9.83107 22.1915C9.68876 22.4654 9.46538 22.6888 9.19142 22.8311C8.9707 22.9458 8.75929 22.9773 8.6116 22.9895C8.48423 23.0001 8.33959 23 8.21847 23C8.21053 23 8.20268 23 8.19495 23H7.78798C6.96944 23 6.29389 23 5.74388 22.9543C5.17253 22.9069 4.64769 22.805 4.15605 22.5496C3.42548 22.1701 2.8298 21.5745 2.4503 20.8439C2.19492 20.3523 2.09305 19.8274 2.0456 19.2561C1.99993 18.7061 1.99994 18.0305 1.99995 17.212L1.99995 12.169C1.99995 12.131 1.99993 12.0936 1.99992 12.0566C1.99955 11.359 1.99928 10.832 2.1318 10.3287C2.24383 9.90321 2.42528 9.49916 2.66884 9.13277C2.95696 8.69935 3.35105 8.34941 3.87272 7.8862C3.90036 7.86165 3.92835 7.83679 3.95671 7.81159L9.22354 3.12996C9.58274 2.81064 9.89467 2.53335 10.1717 2.32363C10.4658 2.10095 10.781 1.90627 11.1611 1.79556Z"
          fill="#000"
        ></path>
      </g>
    </svg>
  );
}

function WishListIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="-4.8 -4.8 33.60 33.60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g id="SVGRepo_bgCarrier" strokeWidth="0">
        <rect
          x="-4.8"
          y="-4.8"
          width="33.60"
          height="33.60"
          rx="16.8"
          fill="#ffffff57"
          strokeWidth="0"
        ></rect>
      </g>
      <g
        id="SVGRepo_tracerCarrier"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></g>
      <g id="SVGRepo_iconCarrier">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 6.00019C10.2006 3.90317 7.19377 3.2551 4.93923 5.17534C2.68468 7.09558 2.36727 10.3061 4.13778 12.5772C5.60984 14.4654 10.0648 18.4479 11.5249 19.7369C11.6882 19.8811 11.7699 19.9532 11.8652 19.9815C11.9483 20.0062 12.0393 20.0062 12.1225 19.9815C12.2178 19.9532 12.2994 19.8811 12.4628 19.7369C13.9229 18.4479 18.3778 14.4654 19.8499 12.5772C21.6204 10.3061 21.3417 7.07538 19.0484 5.17534C16.7551 3.2753 13.7994 3.90317 12 6.00019Z"
          stroke="#000"
          strokeWidth="1.44"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></path>
      </g>
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="-5 -5 35.00 35.00"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g id="SVGRepo_bgCarrier" strokeWidth="0">
        <rect
          x="-5"
          y="-5"
          width="35.00"
          height="35.00"
          rx="17.5"
          fill="#ffffff57"
          strokeWidth="0"
        ></rect>
      </g>
      <g
        id="SVGRepo_tracerCarrier"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></g>
      <g id="SVGRepo_iconCarrier">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M16.5 9C16.5 11.2091 14.7091 13 12.5 13C10.2909 13 8.5 11.2091 8.5 9C8.5 6.79086 10.2909 5 12.5 5C13.5609 5 14.5783 5.42143 15.3284 6.17157C16.0786 6.92172 16.5 7.93913 16.5 9Z"
          stroke="#000"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></path>
        <path
          d="M5.5 18.9999C9.78787 16.3408 15.2121 16.3408 19.5 18.9999"
          stroke="#000"
          strokeWidth="1.5"
          strokeLinecap="round"
        ></path>
      </g>
    </svg>
  );
}

function CartIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="-4.8 -4.8 33.60 33.60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g id="SVGRepo_bgCarrier" strokeWidth="0">
        <rect
          x="-4.8"
          y="-4.8"
          width="33.60"
          height="33.60"
          rx="16.8"
          fill="#ffffff57"
          strokeWidth="0"
        ></rect>
      </g>
      <g
        id="SVGRepo_tracerCarrier"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></g>
      <g id="SVGRepo_iconCarrier">
        <path
          d="M2.5 4.25C2.5 3.83579 2.83579 3.5 3.25 3.5H3.80826C4.75873 3.5 5.32782 4.13899 5.65325 4.73299C5.87016 5.12894 6.02708 5.58818 6.14982 6.00395C6.18306 6.00134 6.21674 6 6.2508 6H18.7481C19.5783 6 20.1778 6.79442 19.9502 7.5928L18.1224 14.0019C17.7856 15.1832 16.7062 15.9978 15.4779 15.9978H9.52977C8.29128 15.9978 7.2056 15.1699 6.87783 13.9756L6.11734 11.2045L4.85874 6.95578L4.8567 6.94834C4.701 6.38051 4.55487 5.85005 4.33773 5.4537C4.12686 5.0688 3.95877 5 3.80826 5H3.25C2.83579 5 2.5 4.66421 2.5 4.25ZM7.57283 10.8403L8.32434 13.5786C8.47333 14.1215 8.96682 14.4978 9.52977 14.4978H15.4779C16.0362 14.4978 16.5268 14.1275 16.68 13.5906L18.4168 7.5H6.58549L7.55906 10.7868C7.56434 10.8046 7.56892 10.8224 7.57283 10.8403Z"
          fill="#000"
        ></path>
        <path
          d="M11 19C11 20.1046 10.1046 21 9 21C7.89543 21 7 20.1046 7 19C7 17.8954 7.89543 17 9 17C10.1046 17 11 17.8954 11 19ZM9.5 19C9.5 18.7239 9.27614 18.5 9 18.5C8.72386 18.5 8.5 18.7239 8.5 19C8.5 19.2761 8.72386 19.5 9 19.5C9.27614 19.5 9.5 19.2761 9.5 19Z"
          fill="#000"
        ></path>
        <path
          d="M18 19C18 20.1046 17.1046 21 16 21C14.8954 21 14 20.1046 14 19C14 17.8954 14.8954 17 16 17C17.1046 17 18 17.8954 18 19ZM16.5 19C16.5 18.7239 16.2761 18.5 16 18.5C15.7239 18.5 15.5 18.7239 15.5 19C15.5 19.2761 15.7239 19.5 16 19.5C16.2761 19.5 16.5 19.2761 16.5 19Z"
          fill="#000"
        ></path>
      </g>
    </svg>
  );
}

function WhatsappIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="-4.8 -4.8 33.60 33.60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g id="SVGRepo_bgCarrier" strokeWidth="0">
        <rect
          x="-4.8"
          y="-4.8"
          width="33.60"
          height="33.60"
          rx="16.8"
          fill="#ffffff57"
          strokeWidth="0"
        ></rect>
      </g>
      <g
        id="SVGRepo_tracerCarrier"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></g>
      <g id="SVGRepo_iconCarrier">
        <path
          d="M17.6 6.31999C16.8669 5.58141 15.9943 4.99596 15.033 4.59767C14.0716 4.19938 13.0406 3.99622 12 3.99999C10.6089 4.00135 9.24248 4.36819 8.03771 5.06377C6.83294 5.75935 5.83208 6.75926 5.13534 7.96335C4.4386 9.16745 4.07046 10.5335 4.06776 11.9246C4.06507 13.3158 4.42793 14.6832 5.12 15.89L4 20L8.2 18.9C9.35975 19.5452 10.6629 19.8891 11.99 19.9C14.0997 19.9001 16.124 19.0668 17.6222 17.5816C19.1205 16.0965 19.9715 14.0796 19.99 11.97C19.983 10.9173 19.7682 9.87634 19.3581 8.9068C18.948 7.93725 18.3505 7.05819 17.6 6.31999ZM12 18.53C10.8177 18.5308 9.65701 18.213 8.64 17.61L8.4 17.46L5.91 18.12L6.57 15.69L6.41 15.44C5.55925 14.0667 5.24174 12.429 5.51762 10.8372C5.7935 9.24545 6.64361 7.81015 7.9069 6.80322C9.1702 5.79628 10.7589 5.28765 12.3721 5.37368C13.9853 5.4597 15.511 6.13441 16.66 7.26999C17.916 8.49818 18.635 10.1735 18.66 11.93C18.6442 13.6859 17.9355 15.3645 16.6882 16.6006C15.441 17.8366 13.756 18.5301 12 18.53ZM15.61 13.59C15.41 13.49 14.44 13.01 14.26 12.95C14.08 12.89 13.94 12.85 13.81 13.05C13.6144 13.3181 13.404 13.5751 13.18 13.82C13.07 13.96 12.95 13.97 12.75 13.82C11.6097 13.3694 10.6597 12.5394 10.06 11.47C9.85 11.12 10.26 11.14 10.64 10.39C10.6681 10.3359 10.6827 10.2759 10.6827 10.215C10.6827 10.1541 10.6681 10.0941 10.64 10.04C10.64 9.93999 10.19 8.95999 10.03 8.56999C9.87 8.17999 9.71 8.23999 9.58 8.22999H9.19C9.08895 8.23154 8.9894 8.25465 8.898 8.29776C8.8066 8.34087 8.72546 8.403 8.66 8.47999C8.43562 8.69817 8.26061 8.96191 8.14676 9.25343C8.03291 9.54495 7.98287 9.85749 8 10.17C8.0627 10.9181 8.34443 11.6311 8.81 12.22C9.6622 13.4958 10.8301 14.5293 12.2 15.22C12.9185 15.6394 13.7535 15.8148 14.58 15.72C14.8552 15.6654 15.1159 15.5535 15.345 15.3915C15.5742 15.2296 15.7667 15.0212 15.91 14.78C16.0428 14.4856 16.0846 14.1583 16.03 13.84C15.94 13.74 15.81 13.69 15.61 13.59Z"
          fill="#000"
        ></path>
      </g>
    </svg>
  );
}
