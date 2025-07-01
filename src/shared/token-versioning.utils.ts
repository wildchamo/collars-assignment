/**
 * Token Versioning utilities - Alternative to blacklisting
 * Instead of storing invalidated tokens, we use user token versions
 * When a user logs out, we increment their token version
 * All existing tokens become invalid instantly
 */

/**
 * Get user's current token version
 */
export const getUserTokenVersion = async (db: D1Database, userId: string): Promise<number> => {
	const result = await db.prepare(
		'SELECT token_version FROM users WHERE id = ?'
	).bind(userId).first();

	return (result as any)?.token_version || 1;
};

/**
 * Increment user's token version (invalidates all their tokens)
 */
export const incrementUserTokenVersion = async (db: D1Database, userId: string): Promise<number> => {
	// Get current version
	const currentVersion = await getUserTokenVersion(db, userId);
	const newVersion = currentVersion + 1;

	// Update user's token version
	await db.prepare(
		'UPDATE users SET token_version = ? WHERE id = ?'
	).bind(newVersion, userId).run();

	return newVersion;
};

/**
 * Validate token version against user's current version
 */
export const isTokenVersionValid = async (db: D1Database, userId: string, tokenVersion: number): Promise<boolean> => {
	const currentVersion = await getUserTokenVersion(db, userId);
	return tokenVersion === currentVersion;
};

/**
 * Generate JWT payload with token version
 */
export const createTokenPayloadWithVersion = async (db: D1Database, user: { id: string; email: string; role: string }): Promise<{
	userId: string;
	email: string;
	role: string;
	tokenVersion: number;
	iat: number;
	exp: number;
}> => {
	const tokenVersion = await getUserTokenVersion(db, user.id);

	return {
		userId: user.id,
		email: user.email,
		role: user.role,
		tokenVersion: tokenVersion,
		iat: Math.floor(Date.now() / 1000),
		exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
	};
};

/**
 * Logout user by invalidating all their tokens
 */
export const logoutUserAllDevices = async (db: D1Database, userId: string): Promise<void> => {
	await incrementUserTokenVersion(db, userId);
};

/**
 * Logout user from all devices except current token
 */
export const logoutOtherDevices = async (db: D1Database, userId: string): Promise<number> => {
	return await incrementUserTokenVersion(db, userId);
};
