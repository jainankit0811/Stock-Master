const nodemailer = require('nodemailer');

/**
 * Create email transporter based on environment configuration
 */
const createTransporter = () => {
  // Check if email is configured
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email configuration not found. Email sending will be disabled.');
    return null;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  return transporter;
};

/**
 * Send OTP email for password reset
 * @param {string} email - Recipient email address
 * @param {string} otp - 6-digit OTP code
 * @param {string} userName - User's name (optional)
 */
const sendOTPEmail = async (email, otp, userName = 'User') => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log('Email service not configured. OTP:', otp);
      // In development, log the OTP instead of sending email
      if (process.env.NODE_ENV === 'development') {
        console.log(`\n=== OTP for ${email} ===`);
        console.log(`OTP: ${otp}`);
        console.log(`Expires in: 10 minutes\n`);
      }
      return { success: true, message: 'OTP generated (email service not configured)' };
    }

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Inventory OS'}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset OTP - Inventory OS',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset OTP</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Password Reset Request</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
            <p style="font-size: 16px;">Hello ${userName},</p>
            <p style="font-size: 16px;">You have requested to reset your password for your Inventory OS account.</p>
            <p style="font-size: 16px;">Please use the following OTP to reset your password:</p>
            <div style="background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <p style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #667eea; margin: 0;">${otp}</p>
            </div>
            <p style="font-size: 14px; color: #666;">This OTP will expire in <strong>10 minutes</strong>.</p>
            <p style="font-size: 14px; color: #666;">If you did not request this password reset, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">This is an automated email. Please do not reply.</p>
          </div>
        </body>
        </html>
      `,
      text: `
        Password Reset Request
        
        Hello ${userName},
        
        You have requested to reset your password for your Inventory OS account.
        
        Your OTP is: ${otp}
        
        This OTP will expire in 10 minutes.
        
        If you did not request this password reset, please ignore this email.
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
};

/**
 * Verify email transporter connection
 */
const verifyConnection = async () => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      return { success: false, message: 'Email service not configured' };
    }
    await transporter.verify();
    return { success: true, message: 'Email service is ready' };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

module.exports = {
  sendOTPEmail,
  verifyConnection
};

