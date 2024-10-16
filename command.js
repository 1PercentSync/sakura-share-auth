import { generateToken, sendTelegramMessage } from "./utils";
import { getUserByUserId, insertNewUser, updateUserName, getLeaderboard, getUserSharecount, deleteUser } from "./database";


// Handle /signup command
export async function handleSignup(userId, userName, chatId, env) {
    try {
        // Check if user exists in database
        const user = await getUserByUserId(userId, env);
        let token;
        if (user) {
            token = user.token;
        } else {
            token = generateToken();
            await insertNewUser(userId, userName, token, env);
        }

        await updateUserName(userId, userName, env);

        return await sendTelegramMessage(chatId, `您的token是: ${userId}:${token}`, env);
    } catch (error) {
        console.error(error);
        return new Response('Error occurred while handling Signup', { status: 500 });
    }
}

// Handle /get command
export async function handleGet(userId, chatId, env) {
    try {
        // Get leaderboard
        const leaderboard = await getLeaderboard(env);
        let message = "排行榜:\n";
        leaderboard.results.forEach((entry, index) => {
            message += `${index + 1}. ${entry.userName}: ${entry.sharecount}\n`;
        });

        // Get user's sharecount if they are registered
        const user = await getUserSharecount(userId, env);
        if (user) {
            message = `您当前的分享次数是: ${user.sharecount}\n\n` + message;
        } else {
            message = "您还未注册。使用 /signup 命令注册后即可参与排行。\n\n" + message;
        }

        return await sendTelegramMessage(chatId, message, env);
    } catch (error) {
        console.error(error);
        return new Response('Error occurred while handling Get', { status: 500 });
    }
}
// Handle /delete command
export async function handleDelete(userId, chatId, env) {
    try{
    await deleteUser(userId, env);
    return await sendTelegramMessage(chatId, '您的账户已被删除。', env);
    } catch (error) {
        console.error(error);
        return new Response('Error occurred while handling Delete', { status: 500 });
    }
}
