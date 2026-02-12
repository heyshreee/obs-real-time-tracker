/**
 * WhatsApp Notification Service
 * Handles sending messages to WhatsApp via a provider (mocked for now)
 */
class WhatsAppService {
    /**
     * Send a WhatsApp message
     * @param {string} to - The recipient's phone number
     * @param {string} message - The message content
     */
    static async send(to, message) {
        try {
            // Check for Twilio Credentials
            const accountSid = process.env.TWILIO_ACCOUNT_SID;
            const authToken = process.env.TWILIO_AUTH_TOKEN;
            const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;

            if (accountSid && authToken && fromNumber) {
                const client = require('twilio')(accountSid, authToken);

                // Ensure 'to' number has whatsapp: prefix if not present
                const toFormatted = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
                const fromFormatted = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`;

                const response = await client.messages.create({
                    body: message,
                    from: fromFormatted,
                    to: toFormatted
                });

                console.log(`[WhatsApp] Sent message to ${to}: ${response.sid}`);
                return { success: true, messageId: response.sid };
            } else {
                // Fallback to Mock
                console.log(`[WhatsApp] (Mock) Sending message to ${to}: ${message}`);
                console.log('[WhatsApp] To enable real sending, set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_NUMBER in .env');
                return { success: true, messageId: `mock_wa_${Date.now()}` };
            }
        } catch (error) {
            console.error('[WhatsApp] Failed to send message:', error);
            // Don't throw, just return failure so we don't crash main flow
            return { success: false, error: error.message };
        }
    }

    /**
     * Send a verification code
     * @param {string} to - The recipient's phone number
     * @param {string} code - The verification code
     */
    static async sendVerificationCode(to, code) {
        const message = `Your OBS Tracker verification code is: ${code}`;
        return this.send(to, message);
    }
}

module.exports = WhatsAppService;
