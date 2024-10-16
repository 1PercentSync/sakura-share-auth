export async function getUserByUserId(userId, env) {
    return await env.DB.prepare('SELECT * FROM auth WHERE userID = ?').bind(userId).first();
}

export async function insertNewUser(userId, userName, token, env) {
    await env.DB.prepare('INSERT INTO auth (userID, userName, token, sharecount) VALUES (?, ?, ?, 0)').bind(userId, userName, token).run();
}

export async function updateUserName(userId, userName, env) {
    await env.DB.prepare('UPDATE auth SET userName = ? WHERE userID = ?').bind(userName, userId).run();
}

export async function getLeaderboard(env) {
    return await env.DB.prepare('SELECT userName, sharecount FROM auth ORDER BY sharecount DESC').all();
}

export async function getUserSharecount(userId, env) {
    return await env.DB.prepare('SELECT sharecount FROM auth WHERE userID = ?').bind(userId).first();
}

export async function deleteUser(userId, env) {
    await env.DB.prepare('DELETE FROM auth WHERE userID = ?').bind(userId).run();
}