const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);

const sendOTP = async (email, otp) => {
    try {
        await resend.emails.send({
            from: 'onboarding@resend.dev', // Default sender for testing
            to: email,
            subject: 'Your OTP for Complaints Registration Platform',
            html: `<p>Your OTP is: <strong>${otp}</strong>. It will expire in 10 minutes.</p>`
        });
        console.log(`OTP sent to ${email}`);
    } catch (error) {
        console.error('Error sending email with Resend:', error);
        throw error;
    }
};

module.exports = { sendOTP };
