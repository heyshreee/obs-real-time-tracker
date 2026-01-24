const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

class EmailService {
    /**
     * Send a welcome email to a new user
     */
    static async sendWelcomeEmail(email, name) {
        try {
            const { data, error } = await resend.emails.send({
                from: FROM_EMAIL,
                to: email,
                subject: 'Welcome to OBS Tracker!',
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1>Welcome, ${name}!</h1>
                        <p>We're excited to have you on board. OBS Tracker helps you monitor your visitors in real-time.</p>
                        <p>Get started by creating your first project.</p>
                        <a href="${(process.env.FRONTEND_URL || '').replace(/\/$/, '')}/dashboard" style="background-color: #2563EB; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Dashboard</a>
                    </div>
                `
            });

            if (error) throw error;
            console.log(`[Email] Welcome email sent to ${email}`);
            return data;
        } catch (error) {
            console.error('[Email] Failed to send welcome email:', error);
            return null;
        }
    }

    /**
     * Send verification code
     */
    static async sendVerificationEmail(email, code) {
        try {
            const { data, error } = await resend.emails.send({
                from: FROM_EMAIL,
                to: email,
                subject: 'Verify your email - OBS Tracker',
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2>Verify your email address</h2>
                        <p>Use the code below to verify your account:</p>
                        <div style="background-color: #f4f4f5; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 10px;">
                            ${code}
                        </div>
                        <p>This code will expire in 10 minutes.</p>
                    </div>
                `
            });

            if (error) throw error;
            console.log(`[Email] Verification email sent to ${email}`);
            return data;
        } catch (error) {
            console.error('[Email] Failed to send verification email:', error);
            return null;
        }
    }

    /**
     * Send password reset link
     */
    static async sendPasswordResetEmail(email, link) {
        try {
            const { data, error } = await resend.emails.send({
                from: FROM_EMAIL,
                to: email,
                subject: 'Reset your password - OBS Tracker',
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2>Reset Password</h2>
                        <p>You requested to reset your password. Click the link below to proceed:</p>
                        <a href="${link}" style="background-color: #2563EB; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
                        <p>If you didn't request this, please ignore this email.</p>
                    </div>
                `
            });

            if (error) throw error;
            console.log(`[Email] Password reset email sent to ${email}`);
            return data;
        } catch (error) {
            console.error('[Email] Failed to send password reset email:', error);
            return null;
        }
    }

    /**
     * Send payment success receipt
     */
    static async sendPaymentSuccessEmail(email, plan, amount, receiptUrl) {
        try {
            const { data, error } = await resend.emails.send({
                from: FROM_EMAIL,
                to: email,
                subject: 'Payment Successful - OBS Tracker',
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2>Payment Successful</h2>
                        <p>Thank you for upgrading to the <strong>${plan}</strong> plan.</p>
                        <p>Amount Paid: <strong>$${amount}</strong></p>
                        <p>Your account has been upgraded instantly.</p>
                    </div>
                `
            });

            if (error) throw error;
            console.log(`[Email] Payment success email sent to ${email}`);
            return data;
        } catch (error) {
            console.error('[Email] Failed to send payment email:', error);
            return null;
        }
    }
}

module.exports = EmailService;
