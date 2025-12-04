// app/routes/careers.jsx
import React from 'react';
import {json} from '@shopify/remix-oxygen';
import {Form, useActionData} from '@remix-run/react';
import {getSeoMeta} from '@shopify/hydrogen';
import careersStyles from '~/styles/careers.css?url';

export const links = () => {
  return [{rel: 'stylesheet', href: careersStyles}];
};

export const meta = () => {
  return getSeoMeta({
    title: 'Careers at 961Souq | Join Our Team',
    description:
      'Apply for open positions at 961Souq in Zalka. Submit your details and resume using our careers application form.',
  });
};

export async function action({request}) {
  const formData = await request.formData();

  const fullName = (formData.get('fullName') || '').toString().trim();
  const email = (formData.get('email') || '').toString().trim();
  const phone = (formData.get('phone') || '').toString().trim();
  const position = (formData.get('position') || '').toString().trim();
  const startDate = (formData.get('startDate') || '').toString().trim();
  const expectedSalary = (formData.get('expectedSalary') || '')
    .toString()
    .trim();
  const location = (formData.get('location') || '').toString().trim();
  const experienceYears = (formData.get('experienceYears') || '')
    .toString()
    .trim();
  const heardAboutUs = (formData.get('heardAboutUs') || '').toString().trim();
  const coverLetter = (formData.get('coverLetter') || '').toString().trim();
  const resumeFile = formData.get('resume');

  const fields = {
    fullName,
    email,
    phone,
    position,
    startDate,
    expectedSalary,
    location,
    experienceYears,
    heardAboutUs,
    coverLetter,
  };

  const errors = {};

  if (!fullName) errors.fullName = 'Full name is required.';
  if (!email) errors.email = 'Email is required.';
  if (!phone) errors.phone = 'Phone number is required.';
  if (!position) errors.position = 'Please select a job position.';
  if (!resumeFile || typeof resumeFile === 'string') {
    errors.resume = 'Please upload your resume.';
  }

  if (Object.keys(errors).length > 0) {
    return json({errors, fields}, {status: 400});
  }

  // Build the text that will be sent to Shopify's contact endpoint.
  // Shopify will email this text to the store email configured in your admin.
  const resumeName = resumeFile.name || 'resume';

  const emailText = `
New job application for 961Souq

Full name: ${fullName}
Email: ${email}
Phone: ${phone}
Position: ${position}
Location: ${location || 'Not specified'}
Preferred start date: ${startDate || 'Not specified'}
Expected salary: ${expectedSalary || 'Not specified'}
Years of experience: ${experienceYears || 'Not specified'}
Heard about us: ${heardAboutUs || 'Not specified'}

Cover letter:
${coverLetter || 'Not provided'}

Resume file name (uploaded via careers form in Hydrogen):
${resumeName}
(Attachment is not included automatically in this email – please request the file from the candidate if needed.)
`.trim();

  // IMPORTANT:
  // This must point to your Online Store contact endpoint (Liquid).
  // Change this if your myshopify domain is different.
  const SHOPIFY_CONTACT_URL =
    process.env.SHOPIFY_CONTACT_URL || 'https://961souq.myshopify.com/contact';

  const body = new URLSearchParams();
  body.set('form_type', 'contact');
  body.set('utf8', '✓');
  body.set('contact[name]', fullName);
  body.set('contact[email]', email);
  body.set('contact[phone]', phone);
  body.set('contact[body]', emailText);

  let contactResponse;
  try {
    contactResponse = await fetch(SHOPIFY_CONTACT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });
  } catch (error) {
    console.error('Error calling Shopify contact endpoint:', error);
    return json(
      {
        errors: {
          form: 'There was a network error sending your application. Please try again later or contact us directly.',
        },
        fields,
      },
      {status: 500},
    );
  }

  if (!contactResponse.ok) {
    console.error(
      'Shopify contact endpoint returned non-OK status:',
      contactResponse.status,
      contactResponse.statusText,
    );
    return json(
      {
        errors: {
          form: 'There was an error sending your application. Please try again later or contact us directly.',
        },
        fields,
      },
      {status: 500},
    );
  }

  // If everything went fine, show success.
  return json({success: true});
}

export default function Careers() {
  const actionData = useActionData();

  const errors = actionData && actionData.errors ? actionData.errors : {};
  const fields = actionData && actionData.fields ? actionData.fields : {};
  const success = actionData && actionData.success;

  return (
    <main className="careers-page">
      <section className="careers-hero">
        <h1>Careers at 961Souq</h1>
        <p>
          Join our team in Zalka and help us build one of the most exciting
          electronics and gaming destinations in Lebanon. Fill out the
          application below and upload your resume to apply.
        </p>
      </section>

      <section className="careers-form-section">
        {errors.form && <div className="form-error-banner">{errors.form}</div>}
        {success && (
          <div className="form-success-banner">
            Thank you for your application. We will review it and contact you if
            there is a match.
          </div>
        )}

        <Form
          method="post"
          encType="multipart/form-data"
          className="careers-form"
        >
          <div className="form-grid">
            {/* Full Name */}
            <div className="form-field">
              <label htmlFor="fullName">
                Full Name <span className="required">*</span>
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                defaultValue={fields.fullName || ''}
                required
              />
              {errors.fullName && (
                <p className="field-error">{errors.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div className="form-field">
              <label htmlFor="email">
                Email <span className="required">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                defaultValue={fields.email || ''}
                required
              />
              {errors.email && <p className="field-error">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div className="form-field">
              <label htmlFor="phone">
                Phone Number <span className="required">*</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={fields.phone || ''}
                required
              />
              {errors.phone && <p className="field-error">{errors.phone}</p>}
            </div>

            {/* Position */}
            <div className="form-field">
              <label htmlFor="position">
                Position you are applying for{' '}
                <span className="required">*</span>
              </label>
              <select
                id="position"
                name="position"
                defaultValue={fields.position || ''}
                required
              >
                <option value="">Select a position</option>
                <option value="Shopify Product Data Entry Assistant (On-site, Zalka)">
                  Shopify Product Data Entry Assistant (On-site, Zalka)
                </option>
                <option value="Customer Support & Live Chat">
                  Customer Support &amp; Live Chat
                </option>
                <option value="Warehouse & Fulfillment">
                  Warehouse &amp; Fulfillment
                </option>
                <option value="Marketing & Content">
                  Marketing &amp; Content
                </option>
              </select>
              {errors.position && (
                <p className="field-error">{errors.position}</p>
              )}
            </div>

            {/* Location / On-site eligibility */}
            <div className="form-field">
              <label htmlFor="location">
                Where are you currently based? Are you able to work on-site in
                Zalka?
              </label>
              <input
                id="location"
                name="location"
                type="text"
                placeholder="Example: Beirut – Yes, I can work on-site in Zalka"
                defaultValue={fields.location || ''}
              />
            </div>

            {/* Preferred start date */}
            <div className="form-field">
              <label htmlFor="startDate">Preferred start date</label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                defaultValue={fields.startDate || ''}
              />
            </div>

            {/* Expected salary */}
            <div className="form-field">
              <label htmlFor="expectedSalary">Expected monthly salary</label>
              <input
                id="expectedSalary"
                name="expectedSalary"
                type="text"
                placeholder="Example: 800 USD / equivalent"
                defaultValue={fields.expectedSalary || ''}
              />
            </div>

            {/* Years of experience */}
            <div className="form-field">
              <label htmlFor="experienceYears">
                Years of relevant experience
              </label>
              <input
                id="experienceYears"
                name="experienceYears"
                type="number"
                min="0"
                step="0.5"
                defaultValue={fields.experienceYears || ''}
              />
            </div>

            {/* Heard about us */}
            <div className="form-field">
              <label htmlFor="heardAboutUs">
                How did you hear about 961Souq?
              </label>
              <input
                id="heardAboutUs"
                name="heardAboutUs"
                type="text"
                placeholder="Example: Instagram, Friend, Job board..."
                defaultValue={fields.heardAboutUs || ''}
              />
            </div>
          </div>

          {/* Cover letter */}
          <div className="form-field full-width">
            <label htmlFor="coverLetter">
              Short cover letter / Why do you want to work at 961Souq?
            </label>
            <textarea
              id="coverLetter"
              name="coverLetter"
              rows={6}
              placeholder="Tell us briefly about yourself, your experience, and why you are a good fit."
              defaultValue={fields.coverLetter || ''}
            />
          </div>

          {/* Resume upload */}
          <div className="form-field full-width">
            <label htmlFor="resume">
              Upload your resume (PDF or Word){' '}
              <span className="required">*</span>
            </label>
            <input
              id="resume"
              name="resume"
              type="file"
              accept=".pdf,.doc,.docx,.rtf,.txt,.odt"
              required
            />
            {errors.resume && <p className="field-error">{errors.resume}</p>}
          </div>

          {/* Consent */}
          <div className="form-field full-width checkbox-field">
            <label>
              <input type="checkbox" name="consent" defaultChecked={true} />
              <span>
                I confirm that the information provided is accurate to the best
                of my knowledge and I agree to be contacted by 961Souq regarding
                this application.
              </span>
            </label>
          </div>

          {/* Submit */}
          <div className="form-actions">
            <button type="submit">Submit Application</button>
          </div>
        </Form>
      </section>
    </main>
  );
}
