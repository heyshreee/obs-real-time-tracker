/**
 * Telegram Notification Service
 * Handles sending messages to Telegram via Bot API (mocked for now)
 */
class TelegramService {
    /**
     * Send a Telegram message
     * @param {string} chatId - The recipient's chat ID
     * @param {string} message - The message content
     */
    static async send(chatId, message) {
        try {
            const botToken = process.env.TELEGRAM_BOT_TOKEN;

            if (botToken) {
                const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: message,
                        parse_mode: 'Markdown'
                    })
                });

                const data = await response.json();

                if (!data.ok) {
                    throw new Error(data.description || 'Telegram API Error');
                }

                console.log(`[Telegram] Sent message to ${chatId}: ${message.substring(0, 30)}...`);
                return { success: true, messageId: data.result.message_id };
            } else {
                // Fallback to Mock
                console.log(`[Telegram] (Mock) Sending message to ${chatId}: ${message}`);
                console.log('[Telegram] To enable real sending, set TELEGRAM_BOT_TOKEN in .env');
                return { success: true, messageId: `mock_tg_${Date.now()}` };
            }
        } catch (error) {
            console.error('[Telegram] Failed to send message:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Mock verification (In real app, user would send /start to bot)
     * This helper just sends a confirmation code
     */
    static async sendVerificationCode(chatId, code) {
        const message = `Your OBS Tracker verification code is: ${code}`;
        return this.send(chatId, message);
    }
}

module.exports = TelegramService;
