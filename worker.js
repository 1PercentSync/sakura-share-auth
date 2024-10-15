// Instead, create a helper function to send messages
async function sendTelegramMessage(chatId, text) {
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
    return response.json();
  }

// Helper function to generate random token
function generateToken(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

async function handleRequest(request) {
    // Check if the request is for the webhook path
    const url = new URL(request.url);
    if (url.pathname !== '/webhook') {
        return new Response('Not Found', { status: 404 });
    }

    // Verify the request is from Telegram
    const secretToken = env.TELEGRAM_SECRET_TOKEN; // 从环境变量中获取密钥
    const telegramToken = request.headers.get('X-Telegram-Bot-Api-Secret-Token');

    if (telegramToken !== secretToken) {
        return new Response('Unauthorized', { status: 401 });
    }

    // Ensure the request method is POST
    if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    // Parse Telegram update
    const update = await request.json();

    // Extract message details
    const message = update.message;
    if (!message) {
        return new Response('OK', { status: 200 });
    }

    const chatId = message.chat.id;
    const text = message.text;
    const userId = message.from.id;
    const userName = message.from.first_name + (message.from.last_name ? ' ' + message.from.last_name : '');

    // Check if it's a private chat or group chat
    const isPrivateChat = message.chat.type === 'private';

    // Handle commands
    if (text && text.startsWith('/')) {
        const command = text.split(' ')[0].toLowerCase();

        switch (command) {
            case '/signup':
                if (!isPrivateChat && !text.includes('@' + env.BOT_USERNAME)) {
                    return new Response('OK', { status: 200 });
                }
                if (!isPrivateChat) {
                    return await sendTelegramMessage(chatId, '注册命令只能在私聊中使用。');
                }
                return await handleSignup(userId, userName, chatId);

            case '/get':
                if (!isPrivateChat && !text.includes('@' + env.BOT_USERNAME)) {
                    return new Response('OK', { status: 200 });
                }
                return await handleGet(userId, chatId);

            case '/delete':
                if (!isPrivateChat && !text.includes('@' + env.BOT_USERNAME)) {
                    return new Response('OK', { status: 200 });
                }
                if (!isPrivateChat) {
                    return await sendTelegramMessage(chatId, '删除命令只能在私聊中使用。');
                }
                return await handleDelete(userId, chatId);

            default:
                if (!isPrivateChat && !text.includes('@' + env.BOT_USERNAME)) {
                    return new Response('OK', { status: 200 });
                }
                return await sendTelegramMessage(chatId, '未知命令。请使用 /signup, /get, 或 /delete。');
        }
    }

    // Return OK response for non-command messages
    return new Response('OK', { status: 200 });
}

// Handle /signup command
async function handleSignup(userId, userName, chatId) {
    // Check if user exists in database
    const user = await DB.prepare('SELECT * FROM auth WHERE userID = ?').bind(userId).first();

    let token;
    if (user) {
        token = user.token;
    } else {
        token = generateToken();
        await DB.prepare('INSERT INTO auth (userID, userName, token, sharecount) VALUES (?, ?, ?, 0)')
            .bind(userId, userName, token)
            .run();
    }

    // Update user's display name
    await DB.prepare('UPDATE auth SET userName = ? WHERE userID = ?')
        .bind(userName, userId)
        .run();

    return await sendTelegramMessage(chatId, `您的token是: ${userId}:${token}`);
}

// Handle /get command
async function handleGet(userId, chatId) {
    // Get leaderboard
    const leaderboard = await DB.prepare('SELECT userName, sharecount FROM auth ORDER BY sharecount DESC LIMIT 10').all();

    let message = "排行榜:\n";
    leaderboard.results.forEach((entry, index) => {
        message += `${index + 1}. ${entry.userName}: ${entry.sharecount}\n`;
    });

    // Get user's sharecount if they are registered
    const user = await DB.prepare('SELECT sharecount FROM auth WHERE userID = ?').bind(userId).first();

    if (user) {
        message = `您当前的分享次数是: ${user.sharecount}\n\n` + message;
    } else {
        message = "您还未注册。使用 /signup 命令注册后即可参与排行。\n\n" + message;
    }

    return await sendTelegramMessage(chatId, message);
}

// Handle /delete command
async function handleDelete(userId, chatId) {
    await DB.prepare('DELETE FROM auth WHERE userID = ?').bind(userId).run();
    return await sendTelegramMessage(chatId, '您的账户已被删除。');
}

// At the end of the file, add:
export default {
    async fetch(request, env) {
      return handleRequest(request);
    }
  };