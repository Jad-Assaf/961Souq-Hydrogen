import React from 'react';
import "../styles/Contact.css"

export const meta = () => {
    return [{ title: 'Contact Us | Hydrogen Storefront' }];
};

export default function ContactUs() {
    return (
        <div className="contact-us-page">
            <h1>Contact Us</h1>
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
