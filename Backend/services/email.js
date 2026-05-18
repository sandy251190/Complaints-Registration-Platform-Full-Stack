const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: '74.125.24.108',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        servername: 'smtp.gmail.com'
    }
})

const sendOTP = async (email, otp) => {
    const mailOptions = {
        from: process.env.GMAIL_USER,
        to: email,
        subject: 'Your OTP for Complaints Registration Platform',
        text: `Your OTP is: ${otp}. It will expire in 10 minutes.`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`OTP sent to ${email}`);
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

module.exports = { sendOTP };
