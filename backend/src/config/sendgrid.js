// backend/src/config/sendgrid.js
import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

// Set the API key for SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Function to send email
export const sendEmail = async (to, subject, text, html) => {
  const msg = {
      to,
      from: 'info@popstock.io',
      subject,
      text,
      html,
  };

  try {
      await sgMail.send(msg);
      console.log('Email sent successfully');
  } catch (error) {
      console.error('Error sending email:', error);
      if (error.response) {
          console.error('SendGrid Response Error:', error.response.body);
      }
  }
};
