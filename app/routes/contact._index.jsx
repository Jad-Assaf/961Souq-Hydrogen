import React from 'react';
import "../styles/Contact.css"

export const meta = () => {
    return [{ title: 'Contact Us | Hydrogen Storefront' }];
};

export default function ContactUs() {
    return (
        <div className="contact-us-page">
            <h1>Contact Us</h1>
            <div className="map-container">
                <iframe
                    width="600"
                    height="450"
                    style="border:0"
                    loading="lazy"
                    allowfullscreen
                    referrerpolicy="no-referrer-when-downgrade"
                    src="https://www.google.com/maps/embed/v1/place?key=AIzaSyARNlt89r96wfjnVl7CiB53VQkmbDBaQ8o
    &q=Space+Needle,Seattle+WA">
                </iframe>
            </div>
            <p>
                We’d love to hear from you! Feel free to reach out to us for any
                inquiries, feedback, or support.
            </p>
            <div className="contact-info">
                <h3>Contact Information:</h3>
                <p><strong>Email:</strong> admin@961souq.com</p>
                <p><strong>Phone:</strong> +961 03 963 961</p>
                <p><strong>Address:</strong> 123 Main Street, Your City, Your Country</p>
            </div>
            <form className="contact-form">
                <h3>Send Us a Message</h3>
                <label>
                    Name:
                    <input type="text" name="name" required />
                </label>
                <label>
                    Email:
                    <input type="email" name="email" required />
                </label>
                <label>
                    Message:
                    <textarea name="message" rows="5" required></textarea>
                </label>
                <button type="submit">Submit</button>
            </form>
        </div>
    );
}
