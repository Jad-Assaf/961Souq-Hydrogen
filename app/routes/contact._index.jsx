import React from 'react';
import "../styles/Contact.css";

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
          <p>
            <strong>Email:</strong> admin@961souq.com
          </p>
          <p>
            <strong>Phone:</strong> <a href="tel:+9611888031">+961 1 888 031</a>
          </p>
          <p>
            <strong>Whatsapp:</strong>{' '}
            <a href="https://wa.me/9613963961">+961 03 963 961</a>
          </p>
          <p>
            <strong>Address:</strong>{' '}
            <a
              href="https://maps.app.goo.gl/wKNzrfSVrLm7srkB7"
              target="_blank"
              title="961Souq Store Location"
            >
              961Souq - Zalka High Way Facing white Tower hotel Ground Floor,
              Zalka, Lebanon.
            </a>
          </p>
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
