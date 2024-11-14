import React from "react";
import '../styles/Footer.css'

const Footer = ({ shopMenu, policiesMenu }) => {
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
                            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                                <i className="fab fa-facebook-f"></i>
                            </a>
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                                <i className="fab fa-instagram"></i>
                            </a>
                            <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer">
                                <i className="fab fa-tiktok"></i>
                            </a>
                            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">
                                <i className="fab fa-youtube"></i>
                            </a>
                            <a href="https://x.com" target="_blank" rel="noopener noreferrer">
                                <i className="fab fa-x-twitter"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
