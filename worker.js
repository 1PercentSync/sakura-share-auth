import { handleSignup, handleGet, handleDelete } from "./command";
import { sendTelegramMessage } from "./utils";

export default {
    async fetch(request, env) {
        const { pathname } = new URL(request.url);
        if (pathname !== '/webhook') {
            return new Response('Not Found', { status: 404 });
        }
        if(request.headers.get('X-Telegram-Bot-Api-Secret-Token')!==env.TELEGRAM_SECRET_TOKEN){
            return new Response('Unauthorized', { status: 401 });
        }
        if (request.method !== 'POST') {
            return new Response('Method Not Allowed', { status: 405 });
        }
        if (request.headers.get('content-type') !== 'application/json') {
            return new Response('Unsupported Media Type', { status: 415 });
        }

        return handleRequest(request, env);
    }
};

async function handleRequest(request, env) {
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
                    return await sendTelegramMessage(chatId, '注册命令只能在私聊中使用。', env);
                }
                return await handleSignup(userId, userName, chatId, env);

            case '/get':
                if (!isPrivateChat && !text.includes('@' + env.BOT_USERNAME)) {
                    return new Response('OK', { status: 200 });
                }
                return await handleGet(userId, chatId, env);

            case '/delete':
                if (!isPrivateChat && !text.includes('@' + env.BOT_USERNAME)) {
                    return new Response('OK', { status: 200 });
                }
                if (!isPrivateChat) {
                    return await sendTelegramMessage(chatId, '删除命令只能在私聊中使用。', env);
                }
                return await handleDelete(userId, chatId, env);

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