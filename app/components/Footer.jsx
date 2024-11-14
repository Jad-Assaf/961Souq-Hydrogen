import React from "react";
import '../styles/Footer.css'

export const Footer = ({ shopMenu, policiesMenu }) => {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-sections">
                    {/* Shop Menu */}
                    <div className="footer-column">
                        <h3>Shop</h3>
                        <ul>
                            {shopMenu.map((item, index) => (
                                <li key={index}>
                                    <a href={item.link}>{item.title}</a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Policies Menu */}
                    <div className="footer-column">
                        <h3>Policies</h3>
                        <ul>
                            {policiesMenu.map((item, index) => (
                                <li key={index}>
                                    <a href={item.link}>{item.title}</a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Customer Service */}
                    <div className="footer-column">
                        <h3>Customer Service</h3>
                        <ul className="contact-info">
                            <li>
                                <i className="fas fa-map-marker-alt"></i> 961souq - Zalka High
                                Way Facing White Tower Hotel Ground Floor, Zalka, Lebanon.
                            </li>
                            <li>
                                <i className="fas fa-phone-alt"></i>{" "}
                                <a href="tel:+9611888031">+961 1 888 031</a>
                            </li>
                            <li>
                                <i className="fab fa-whatsapp"></i>{" "}
                                <a href="https://wa.me/9613963961">+961 3 963 961</a>
                            </li>
                            <li>
                                <i className="fas fa-envelope"></i>{" "}
                                <a href="mailto:admin@961souq.com">admin@961souq.com</a>
                            </li>
                        </ul>
                        {/* Social Media Links */}
                        <div className="social-links">
                            <a href="https://www.facebook.com/961souq" target="_blank" class="link link--text list-social__link icon-facebook"><svg aria-hidden="true" focusable="false" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" class="icon icon-facebook"><path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z"></path></svg></a>
                            <a href="https://instagram.com/961souq" target="_blank" class="link link--text list-social__link icon-instagram"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" xml:space="preserve" aria-hidden="true" focusable="false" role="presentation" class="icon icon-instagram"><g><path d="M256,152c-57.9,0-105,47.1-105,105s47.1,105,105,105s105-47.1,105-105S313.9,152,256,152z M256,152   c-57.9,0-105,47.1-105,105s47.1,105,105,105s105-47.1,105-105S313.9,152,256,152z M437,0H75C33.6,0,0,33.6,0,75v362   c0,41.4,33.6,75,75,75h362c41.4,0,75-33.6,75-75V75C512,33.6,478.4,0,437,0z M256,392c-74.399,0-135-60.601-135-135   c0-74.401,60.601-135,135-135s135,60.599,135,135C391,331.399,330.399,392,256,392z M421,122c-16.5,0-30-13.5-30-30s13.5-30,30-30   s30,13.5,30,30S437.5,122,421,122z M256,152c-57.9,0-105,47.1-105,105s47.1,105,105,105s105-47.1,105-105S313.9,152,256,152z    M256,152c-57.9,0-105,47.1-105,105s47.1,105,105,105s105-47.1,105-105S313.9,152,256,152z M256,152c-57.9,0-105,47.1-105,105   s47.1,105,105,105s105-47.1,105-105S313.9,152,256,152z"></path></g></svg></a>
                            <a href="https://www.tiktok.com/@961souq" target="_blank" class="link link--text list-social__link icon-tiktok"><svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" aria-hidden="true" focusable="false" class="icon icon-tiktok"><path d="m475.074 0h-438.148c-20.395 0-36.926 16.531-36.926 36.926v438.148c0 20.395 16.531 36.926 36.926 36.926h438.148c20.395 0 36.926-16.531 36.926-36.926v-438.148c0-20.395-16.531-36.926-36.926-36.926zm-90.827 195.959v34.613c-16.322.006-32.181-3.192-47.137-9.503-9.617-4.06-18.577-9.292-26.772-15.613l.246 106.542c-.103 23.991-9.594 46.532-26.772 63.51-13.98 13.82-31.695 22.609-50.895 25.453-4.512.668-9.103 1.011-13.746 1.011-20.553 0-40.067-6.659-56.029-18.943-3.004-2.313-5.876-4.82-8.612-7.521-18.617-18.4-28.217-43.34-26.601-69.575 1.234-19.971 9.229-39.017 22.558-53.945 17.635-19.754 42.306-30.719 68.684-30.719 4.643 0 9.234.348 13.746 1.017v12.798 35.601c-4.277-1.411-8.846-2.187-13.603-2.187-24.1 0-43.597 19.662-43.237 43.779.228 15.431 8.658 28.92 21.09 36.355 5.842 3.495 12.564 5.659 19.737 6.053 5.62.308 11.016-.474 16.013-2.124 17.218-5.688 29.639-21.861 29.639-40.935l.057-71.346v-130.252h47.668c.046 4.723.525 9.332 1.416 13.797 3.598 18.075 13.786 33.757 27.966 44.448 12.364 9.326 27.76 14.854 44.448 14.854.011 0 .148 0 .137-.011v12.843z"></path></svg></a>
                            <a href="https://www.youtube.com/@961souq" target="_blank" class="link link--text list-social__link icon-youtube"><svg aria-hidden="true" focusable="false" role="presentation" class="icon icon-youtube" viewBox="0 0 100 70"><path d="M98 11c2 7.7 2 24 2 24s0 16.3-2 24a12.5 12.5 0 01-9 9c-7.7 2-39 2-39 2s-31.3 0-39-2a12.5 12.5 0 01-9-9c-2-7.7-2-24-2-24s0-16.3 2-24c1.2-4.4 4.6-7.8 9-9 7.7-2 39-2 39-2s31.3 0 39 2c4.4 1.2 7.8 4.6 9 9zM40 50l26-15-26-15v30z"></path></svg></a>
                            <a href="https://twitter.com/961souq" target="_blank" class="link link--text list-social__link icon-twitter"><svg aria-hidden="true" focusable="false" role="presentation" class="icon icon-twitter" viewBox="0 0 35 35"><path d="M20.3306 15.2794L31.4059 3H28.7809L19.1669 13.6616L11.4844 3H2.625L14.2406 19.124L2.625 32H5.25L15.4044 20.7397L23.5178 32H32.3772L20.3306 15.2794ZM16.7366 19.2649L15.5597 17.6595L6.195 4.885H10.2266L17.7822 15.1945L18.9591 16.7999L28.7831 30.202H24.7516L16.7366 19.2649Z"></path></svg></a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};