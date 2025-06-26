import React from 'react';
import '../styles/Contact.css';

export const meta = () => {
  return [{title: 'Contact Us | 961Souq'}];
};

export default function ContactUs() {
  return (
    <>
      <div className="map-container">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d17417.544621297075!2d35.56700252525478!3d33.9034597890146!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x151f3dfcf5060a0d%3A0xf692c306dec18a7d!2s961SOUQ.COM!5e0!3m2!1sen!2slb!4v1744877820848!5m2!1sen!2slb"
          width="100%"
          height="600"
          style={{border: 0}}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>
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
            <a
              href="https://wa.me/9613963961"
              aria-label="Whatsapp Link"
              target="_blank"
            >
              +961 03 963 961
            </a>
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
    </>
  );
}
