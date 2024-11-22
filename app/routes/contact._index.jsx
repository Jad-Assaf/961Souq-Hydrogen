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
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3770.1036075725224!2d35.573411244654345!3d33.90335299151777!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x151f3dfcf5060a0d%3A0xf692c306dec18a7d!2s961SOUQ.COM!5e1!3m2!1sen!2slb!4v1732207673920!5m2!1sen!2slb"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
            </div>
            <p>
                We’d love to hear from you! Feel free to reach out to us for any
                inquiries, feedback, or support.
            </p>
            <div className="contact-info">
                <h3>Contact Information:</h3>
                <p><strong>Email:</strong> support@example.com</p>
                <p><strong>Phone:</strong> +1 (234) 567-890</p>
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
