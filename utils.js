export async function sendTelegramMessage(chatId, text, env) {
    try {
        const response = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
            }),
        });
        if (response.ok) {
            return new Response('Message sent successfully!', { status: 200 });
        } else {
            return new Response('Failed to send message.', { status: 500 });
        }

    } catch (error) {
        console.error(error);
        return new Response('Error occurred while sending the message.', { status: 500 });
    }
}

export function generateToken(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
