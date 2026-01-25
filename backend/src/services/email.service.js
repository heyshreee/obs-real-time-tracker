const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

class EmailService {
    static getBaseTemplate(content) {
        return `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; color: #333333; line-height: 1.6;">
                ${content}
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea; font-size: 12px; color: #888888; text-align: center;">
                    <p>The OBS Tracker Team<br/>
                    <a href="${FRONTEND_URL}" style="color: #2563EB; text-decoration: none;">${FRONTEND_URL}</a></p>
                    <p>Please do not reply to this automated message.</p>
                </div>
            </div>
        `;
    }

    static getButton(text, url) {
        return `
            <div style="text-align: center; margin: 30px 0;">
                <a href="${url}" style="background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">${text}</a>
            </div>
        `;
    }

    /**
     * Send verification email (Welcome + Verify)
     */
    static async sendVerificationEmail(email, code, name = 'User') {
        try {
            const html = EmailService.getBaseTemplate(`
                <h2 style="color: #111827; margin-bottom: 20px;">Welcome to OBS Tracker! Please Verify Your Email</h2>
                <p>Dear ${name},</p>
                <p>Welcome to OBS Tracker! We're excited to have you on board.</p>
                <p>Your account has been successfully created. To complete your registration and activate your account, please use the verification code below:</p>
                
                <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; border-radius: 8px; margin: 30px 0; color: #111827;">
                    ${code}
                </div>

                ${EmailService.getButton('Verify Email Address', `${FRONTEND_URL}/verify-email`)}

                <p>This code will expire in 10 minutes.</p>
                <p>Once verified, you'll have full access to all the features of your new account. If you did not create an account with us, please ignore this email.</p>
                <p>We're here to help. If you have any questions, feel free to visit our Help Center.</p>
            `);

            const { data, error } = await resend.emails.send({
                from: FROM_EMAIL,
                to: email,
                subject: 'Welcome to OBS Tracker! Please Verify Your Email',
                html
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
    static async sendPasswordResetEmail(email, link, name = 'User') {
        try {
            const html = EmailService.getBaseTemplate(`
                <h2 style="color: #111827; margin-bottom: 20px;">Action Required: Reset Your OBS Tracker Password</h2>
                <p>Dear ${name},</p>
                <p>We received a request to reset the password for your OBS Tracker account.</p>
                <p>To proceed with creating a new password, please click the button below. This link will expire in 24 hours for your security.</p>
                
                ${EmailService.getButton('Reset Password', link)}

                <p>If you did not request a password reset, you can safely ignore this email. Your account remains secure.</p>
            `);

            const { data, error } = await resend.emails.send({
                from: FROM_EMAIL,
                to: email,
                subject: 'Action Required: Reset Your OBS Tracker Password',
                html
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
    static async sendPaymentSuccessEmail(email, plan, amount, transactionId, date, name = 'User') {
        try {
            const html = EmailService.getBaseTemplate(`
                <h2 style="color: #111827; margin-bottom: 20px;">Payment Successful: Receipt for Transaction ${transactionId}</h2>
                <p>Dear ${name},</p>
                <p>Thank you for your payment.</p>
                <p>We’re writing to confirm that your transaction was successful. A receipt for your purchase is below.</p>
                
                <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
                    <h3 style="margin-top: 0; color: #374151;">Transaction Details:</h3>
                    <ul style="list-style: none; padding: 0; margin: 0;">
                        <li style="padding: 5px 0;"><strong>Product/Service:</strong> ${plan}</li>
                        <li style="padding: 5px 0;"><strong>Amount Paid:</strong> $${amount}</li>
                        <li style="padding: 5px 0;"><strong>Transaction ID:</strong> ${transactionId}</li>
                        <li style="padding: 5px 0;"><strong>Date:</strong> ${date}</li>
                    </ul>
                </div>

                <p>You can view your complete payment history and manage your subscription at any time from your account dashboard.</p>

                ${EmailService.getButton('View Receipt', `${FRONTEND_URL}/dashboard/settings`)}

                <p>If you have any questions regarding this transaction, please contact our support team.</p>
                <p>Thank you for your business,</p>
            `);

            const { data, error } = await resend.emails.send({
                from: FROM_EMAIL,
                to: email,
                subject: `Payment Successful: Receipt for Transaction ${transactionId}`,
                html
            });

            if (error) throw error;
            console.log(`[Email] Payment success email sent to ${email}`);
            return data;
        } catch (error) {
            console.error('[Email] Failed to send payment success email:', error);
            return null;
        }
    }

    /**
     * Send payment failed notification
     */
    static async sendPaymentFailedEmail(email, amount, date, name = 'User') {
        try {
            const html = EmailService.getBaseTemplate(`
                <h2 style="color: #dc2626; margin-bottom: 20px;">Action Required: Payment Failed for your OBS Tracker Account</h2>
                <p>Dear ${name},</p>
                <p>We attempted to process your payment for <strong>$${amount}</strong> on <strong>${date}</strong>, but unfortunately, the transaction was declined.</p>
                
                <p>This can happen for several reasons, such as:</p>
                <ul>
                    <li>Insufficient funds</li>
                    <li>Incorrect card details (e.g., expiration date or CVV)</li>
                    <li>Your bank or card issuer declined the transaction</li>
                </ul>

                <p>To ensure uninterrupted access to your OBS Tracker services, please update your payment method or retry the payment as soon as possible.</p>

                ${EmailService.getButton('Update Payment Method', `${FRONTEND_URL}/dashboard/settings`)}

                <p>If you believe this is an error, we recommend contacting your bank or financial institution for more information.</p>
            `);

            const { data, error } = await resend.emails.send({
                from: FROM_EMAIL,
                to: email,
                subject: 'Action Required: Payment Failed for your OBS Tracker Account',
                html
            });

            if (error) throw error;
            console.log(`[Email] Payment failed email sent to ${email}`);
            return data;
        } catch (error) {
            console.error('[Email] Failed to send payment failed email:', error);
            return null;
        }
    }

    /**
     * Send new login notification
     */
    static async sendNewLoginEmail(email, loginDetails, name = 'User') {
        try {
            const html = EmailService.getBaseTemplate(`
                <h2 style="color: #111827; margin-bottom: 20px;">Security Alert: New Sign-in to Your OBS Tracker Account</h2>
                <p>Dear ${name},</p>
                <p>We noticed a new sign-in to your OBS Tracker account.</p>
                
                <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
                    <h3 style="margin-top: 0; color: #374151;">Sign-in Details:</h3>
                    <ul style="list-style: none; padding: 0; margin: 0;">
                        <li style="padding: 5px 0;"><strong>Date & Time:</strong> ${loginDetails.time}</li>
                        <li style="padding: 5px 0;"><strong>IP Address:</strong> ${loginDetails.ip}</li>
                        <li style="padding: 5px 0;"><strong>Location:</strong> ${loginDetails.location}</li>
                        <li style="padding: 5px 0;"><strong>Device/Browser:</strong> ${loginDetails.device}</li>
                    </ul>
                </div>

                <p><strong>If this was you</strong>, you can disregard this message.</p>
                <p><strong>If this was not you</strong>, your account may be compromised. Please take the following steps immediately:</p>
                <ol>
                    <li><strong>Reset your password</strong> to something strong and unique.</li>
                    <li>Review your account settings for any unauthorized changes.</li>
                </ol>

                ${EmailService.getButton('Review Recent Activity', `${FRONTEND_URL}/dashboard/settings`)}

                <p>Your security is our top priority.</p>
            `);

            const { data, error } = await resend.emails.send({
                from: FROM_EMAIL,
                to: email,
                subject: 'Security Alert: New Sign-in to Your OBS Tracker Account',
                html
            });

            if (error) throw error;
            console.log(`[Email] New login email sent to ${email}`);
            return data;
        } catch (error) {
            console.error('[Email] Failed to send new login email:', error);
            return null;
        }
    }

    /**
     * Send password changed confirmation
     */
    static async sendPasswordChangedEmail(email, date, time, name = 'User') {
        try {
            const html = EmailService.getBaseTemplate(`
                <h2 style="color: #111827; margin-bottom: 20px;">Security Alert: Your OBS Tracker Password Has Been Changed</h2>
                <p>Dear ${name},</p>
                <p>This email is to confirm that the password for your OBS Tracker account was recently changed on <strong>${date}</strong> at <strong>${time}</strong>.</p>
                
                <p><strong>If you made this change</strong>, no further action is required.</p>
                <p><strong>If you did not change your password</strong>, it's possible your account has been accessed by someone else. Please reset your password immediately to secure your account and contact our support team.</p>

                ${EmailService.getButton('Reset Password Now', `${FRONTEND_URL}/forgot-password`)}

                <p>For your protection, we recommend using a strong, unique password.</p>
            `);

            const { data, error } = await resend.emails.send({
                from: FROM_EMAIL,
                to: email,
                subject: 'Security Alert: Your OBS Tracker Password Has Been Changed',
                html
            });

            if (error) throw error;
            console.log(`[Email] Password changed email sent to ${email}`);
            return data;
        } catch (error) {
            console.error('[Email] Failed to send password changed email:', error);
            return null;
        }
    }

    /**
     * Send report ready notification
     */
    static async sendReportReadyEmail(email, reportName, period, date, name = 'User') {
        try {
            const html = EmailService.getBaseTemplate(`
                <h2 style="color: #111827; margin-bottom: 20px;">Your OBS Tracker Report is Ready: ${reportName}</h2>
                <p>Dear ${name},</p>
                <p>The report you requested has been successfully generated and is now ready for viewing.</p>
                
                <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
                    <h3 style="margin-top: 0; color: #374151;">Report Details:</h3>
                    <ul style="list-style: none; padding: 0; margin: 0;">
                        <li style="padding: 5px 0;"><strong>Report Name:</strong> ${reportName}</li>
                        <li style="padding: 5px 0;"><strong>Reporting Period:</strong> ${period}</li>
                        <li style="padding: 5px 0;"><strong>Generated On:</strong> ${date}</li>
                    </ul>
                </div>

                <p>You can access and download your report by clicking the button below.</p>

                ${EmailService.getButton('View Report', `${FRONTEND_URL}/dashboard/analytics`)}

                <p>Please note that this link may expire after a certain period. You can always generate a new report from your dashboard.</p>
            `);

            const { data, error } = await resend.emails.send({
                from: FROM_EMAIL,
                to: email,
                subject: `Your OBS Tracker Report is Ready: ${reportName}`,
                html
            });

            if (error) throw error;
            console.log(`[Email] Report ready email sent to ${email}`);
            return data;
        } catch (error) {
            console.error('[Email] Failed to send report ready email:', error);
            return null;
        }
    }

    /**
     * Send plan downgraded notification
     */
    static async sendPlanDowngradedEmail(email, plan, date, name = 'User') {
        try {
            const html = EmailService.getBaseTemplate(`
                <h2 style="color: #111827; margin-bottom: 20px;">Your Plan Has Been Updated</h2>
                <p>Dear ${name},</p>
                <p>This email is to confirm that your OBS Tracker account has been downgraded to the <strong>${plan}</strong> plan on <strong>${date}</strong>.</p>
                
                <p>You will no longer have access to Pro features such as unlimited projects and extended data retention.</p>
                <p>If this was a mistake, you can upgrade again at any time from your dashboard.</p>

                ${EmailService.getButton('Manage Subscription', `${FRONTEND_URL}/dashboard/settings`)}
            `);

            const { data, error } = await resend.emails.send({
                from: FROM_EMAIL,
                to: email,
                subject: 'Your Plan Has Been Updated - OBS Tracker',
                html
            });

            if (error) throw error;
            console.log(`[Email] Plan downgraded email sent to ${email}`);
            return data;
        } catch (error) {
            console.error('[Email] Failed to send plan downgraded email:', error);
            return null;
        }
    }

    /**
     * Send receipt email with PDF attachment
     */
    static async sendReceiptEmail(email, receiptBuffer, transactionId, name = 'User') {
        try {
            const html = EmailService.getBaseTemplate(`
                <h2 style="color: #111827; margin-bottom: 20px;">Your Receipt for Transaction ${transactionId}</h2>
                <p>Dear ${name},</p>
                <p>Please find attached the receipt for your recent transaction.</p>
                <p>Thank you for your business.</p>
                
                ${EmailService.getButton('Manage Subscription', `${FRONTEND_URL}/dashboard/settings`)}
            `);

            const { data, error } = await resend.emails.send({
                from: FROM_EMAIL,
                to: email,
                subject: `Receipt for Transaction ${transactionId}`,
                html,
                attachments: [
                    {
                        filename: `receipt_${transactionId}.pdf`,
                        content: receiptBuffer
                    }
                ]
            });

            if (error) throw error;
            console.log(`[Email] Receipt email sent to ${email}`);
            return data;
        } catch (error) {
            console.error('[Email] Failed to send receipt email:', error);
            return null;
        }
    }

    /**
     * Send welcome email (Generic - kept for backward compatibility if needed, but sendVerificationEmail is preferred for new users)
     */
    static async sendWelcomeEmail(email, name) {
        // Redirect to verification email logic if it's a new registration flow
        // Or keep as a separate "After Verification" welcome email
        try {
            const html = EmailService.getBaseTemplate(`
                <h2 style="color: #111827; margin-bottom: 20px;">Welcome to OBS Tracker!</h2>
                <p>Dear ${name},</p>
                <p>We're excited to have you on board. OBS Tracker helps you monitor your visitors in real-time.</p>
                <p>Get started by creating your first project.</p>
                ${EmailService.getButton('Go to Dashboard', `${FRONTEND_URL}/dashboard`)}
            `);

            const { data, error } = await resend.emails.send({
                from: FROM_EMAIL,
                to: email,
                subject: 'Welcome to OBS Tracker!',
                html
            });

            if (error) throw error;
            console.log(`[Email] Welcome email sent to ${email}`);
            return data;
        } catch (error) {
            console.error('[Email] Failed to send welcome email:', error);
            return null;
        }
    }
}

module.exports = EmailService;
