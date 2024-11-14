import React from "react";
import { useShopQuery, gql } from "@shopify/hydrogen";
import "../styles/Footer.css";

export function Footer() {
    // Fetch both menus using `useShopQuery`
    const { data } = useShopQuery({
        query: FOOTER_MENUS_QUERY,
        variables: {
            shopHandle: "new-main-menu", // Handle for the "Shop" menu
            policiesHandle: "Footer-Menu1", // Handle for the "Policies" menu
        },
    });

    const shopMenu = data?.shopMenu?.items || [];
    const policiesMenu = data?.policiesMenu?.items || [];

    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-sections">
                    {/* Shop Menu */}
                    <div className="footer-column">
                        <h3>Shop</h3>
                        <ul>
                            {shopMenu.map((item) => (
                                <li key={item.id}>
                                    <a href={item.url}>{item.title}</a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Policies Menu */}
                    <div className="footer-column">
                        <h3>Policies</h3>
                        <ul>
                            {policiesMenu.map((item) => (
                                <li key={item.id}>
                                    <a href={item.url}>{item.title}</a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Customer Service Section */}
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
}

const FOOTER_MENUS_QUERY = gql`
    query FooterMenus($shopHandle: String!, $policiesHandle: String!) {
        shopMenu: menu(handle: $shopHandle) {
            items {
                id
                title
                url
            }
        }
        policiesMenu: menu(handle: $policiesHandle) {
            items {
                id
                title
                url
            }
        }
    }
`;
