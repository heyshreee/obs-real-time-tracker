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
            // In a real implementation, this would call the WhatsApp Business API or a provider like Twilio
            // For now, we'll just log it as we don't have credentials
            console.log(`[WhatsApp] Sending message to ${to}: ${message}`);
            
            // Simulation of API call
            return { success: true, messageId: `wa_${Date.now()}` };
        } catch (error) {
            console.error('[WhatsApp] Failed to send message:', error);
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
