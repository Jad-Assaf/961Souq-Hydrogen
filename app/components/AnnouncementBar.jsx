const STORE_MAP_URL = 'https://maps.app.goo.gl/wKNzrfSVrLm7srkB7';

const SOCIAL_LINKS = [
  {
    href: 'https://instagram.com/961Souq',
    label: 'Instagram',
    Icon: InstagramIcon,
  },
  {
    href: 'https://www.facebook.com/961souq',
    label: 'Facebook',
    Icon: FacebookIcon,
  },
  {
    href: 'https://www.tiktok.com/@961souq',
    label: 'TikTok',
    Icon: TikTokIcon,
  },
  {
    href: 'https://wa.me/96170961961',
    label: 'WhatsApp',
    Icon: WhatsAppIcon,
  },
];

export function AnnouncementBar() {
  return (
    <div className="header-announcement">
      <div className="header-announcement__inner">
        <a
          href={STORE_MAP_URL}
          target="_blank"
          rel="noreferrer"
          className="header-announcement__map"
          aria-label="Open our Zalka showroom location in Google Maps"
        >
          <MapPinIcon className="header-announcement__map-icon" />
          <span className="header-announcement__map-prefix">
            Visit our Zalka showroom
          </span>
        </a>

        <div className="header-announcement__social">
          <span className="header-announcement__social-label">Follow us</span>
          {SOCIAL_LINKS.map(({href, label, Icon}) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noreferrer"
              className="header-announcement__social-link"
              aria-label={label}
            >
              <Icon className="header-announcement__icon" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function MapPinIcon(props) {
  return (
    <svg
      viewBox="0 0 384 512"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M168.3 499.2C116.1 435 0 279.4 0 192C0 86 86 0 192 0s192 86 192 192c0 87.4-116.1 243-168.3 307.2-12.4 15.3-35.7 15.3-47.7 0zM192 272c44.2 0 80-35.8 80-80s-35.8-80-80-80-80 35.8-80 80 35.8 80 80 80z" />
    </svg>
  );
}

function InstagramIcon(props) {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M349.3 69.3H162.7C111.8 69.3 69.3 111.8 69.3 162.7v186.6c0 50.9 42.5 93.4 93.4 93.4h186.6c50.9 0 93.4-42.5 93.4-93.4V162.7c0-50.9-42.5-93.4-93.4-93.4zM256 371.1c-63.4 0-115.1-51.6-115.1-115.1S192.6 140.9 256 140.9 371.1 192.6 371.1 256 319.4 371.1 256 371.1zm119.7-208.3c-14.8 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8-12 26.8-26.8 26.8z" />
      <path d="M256 181.2c-41.3 0-74.8 33.6-74.8 74.8s33.6 74.8 74.8 74.8 74.8-33.6 74.8-74.8-33.5-74.8-74.8-74.8z" />
    </svg>
  );
}

function FacebookIcon(props) {
  return (
    <svg
      viewBox="0 0 320 512"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M279.1 288l14.2-92.7h-88.9v-60.1c0-25.4 12.4-50.1 52.2-50.1h40.4V6.3S260.4 0 225.4 0C152.1 0 104.3 44.4 104.3 124.7v70.6H22.9V288h81.4v224h100.2V288h74.6z" />
    </svg>
  );
}

function TikTokIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M16.8218 5.1344C16.0887 4.29394 15.648 3.19805 15.648 2H14.7293C14.9659 3.3095 15.7454 4.43326 16.8218 5.1344Z" />
      <path d="M8.3218 11.9048C6.73038 11.9048 5.43591 13.2004 5.43591 14.7931C5.43591 15.903 6.06691 16.8688 6.98556 17.3517C6.64223 16.8781 6.43808 16.2977 6.43808 15.6661C6.43808 14.0734 7.73255 12.7778 9.324 12.7778C9.62093 12.7778 9.90856 12.8288 10.1777 12.9124V9.40192C9.89927 9.36473 9.61628 9.34149 9.324 9.34149C9.27294 9.34149 9.22654 9.34614 9.1755 9.34614V12.0394C8.90176 11.9558 8.61873 11.9048 8.3218 11.9048Z" />
      <path d="M19.4245 6.67608V9.34614C17.6429 9.34614 15.9912 8.77501 14.6456 7.80911V14.7977C14.6456 18.2851 11.8108 21.127 8.32172 21.127C6.97621 21.127 5.7235 20.6998 4.69812 19.98C5.8534 21.2198 7.50049 22 9.32392 22C12.8083 22 15.6478 19.1627 15.6478 15.6707V8.68211C16.9933 9.64801 18.645 10.2191 20.4267 10.2191V6.78293C20.0787 6.78293 19.7446 6.74574 19.4245 6.67608Z" />
      <path d="M14.6456 14.7977V7.80911C15.9912 8.77501 17.6429 9.34614 19.4245 9.34614V6.67608C18.3945 6.45788 17.4899 5.90063 16.8218 5.1344C15.7454 4.43326 14.9704 3.3095 14.7245 2H12.2098L12.2051 15.7775C12.1495 17.3192 10.8782 18.5591 9.32393 18.5591C8.35884 18.5591 7.50977 18.0808 6.98085 17.3564C6.06219 16.8688 5.4312 15.9076 5.4312 14.7977C5.4312 13.205 6.72567 11.9094 8.31708 11.9094C8.61402 11.9094 8.90168 11.9605 9.17079 12.0441V9.35079C5.75598 9.42509 3 12.2298 3 15.6707C3 17.3331 3.64492 18.847 4.69812 19.98C5.7235 20.6998 6.97621 21.127 8.32172 21.127C11.8061 21.127 14.6456 18.2851 14.6456 14.7977Z" />
    </svg>
  );
}

function WhatsAppIcon(props) {
  return (
    <svg
      viewBox="0 0 448 512"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32 101.5 32 1.9 131.6 1.9 254c0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-23.1-115.1-67.1-157zM224 438.7h-.1c-29.7 0-58.8-8-84.3-23.2l-6-3.6-69.8 18.3 18.7-68.1-3.9-6.2c-16.6-26.4-25.3-56.9-25.3-88.1 0-91.8 74.7-166.5 166.6-166.5 44.5 0 86.4 17.3 117.9 48.8 31.4 31.6 48.7 73.4 48.7 117.9-.1 91.9-74.8 166.6-166.5 166.6zm91.4-125.1c-5-2.5-29.5-14.6-34.1-16.3-4.6-1.7-7.9-2.5-11.2 2.5-3.3 5-12.9 16.3-15.8 19.6-2.9 3.3-5.8 3.8-10.8 1.3-29.5-14.8-48.9-26.4-68.4-59.8-5.2-8.9 5.2-8.3 14.8-27.4 1.7-3.3.8-6.2-.4-8.7-1.2-2.5-11.2-27-15.4-36.9-4.1-9.8-8.3-8.5-11.2-8.7-2.9-.1-6.2-.1-9.6-.1s-8.7 1.2-13.3 6.2c-4.6 5-17.5 17.1-17.5 41.6s17.9 48.2 20.4 51.6c2.5 3.3 35.1 53.6 85.1 75.1 31.7 13.7 44.1 14.8 59.9 12.2 9.6-1.4 29.5-12.1 33.7-23.8 4.2-11.6 4.2-21.6 2.9-23.7-1.3-2.1-4.6-3.3-9.6-5.8z" />
    </svg>
  );
}
