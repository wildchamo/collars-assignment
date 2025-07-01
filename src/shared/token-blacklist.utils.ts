/**
 * Token Blacklist utilities for invalidating JWT tokens
 * Since JWT is stateless, we need to store invalidated tokens somewhere
 */

export interface BlacklistedToken {
	token: string;
	invalidatedAt: string; // ISO timestamp
	expiresAt: string; // When the token would naturally expire
}

/**
 * Add token to blacklist (database approach)
 */
export const addToBlacklist = async (db: D1Database, token: string, expiresAt: Date): Promise<void> => {
	const now = new Date().toISOString();
	const expiry = expiresAt.toISOString();

	await db.prepare(
		'INSERT INTO token_blacklist (token, invalidated_at, expires_at) VALUES (?, ?, ?)'
	).bind(token, now, expiry).run();
};

/**
 * Check if token is blacklisted
 */
export const isTokenBlacklisted = async (db: D1Database, token: string): Promise<boolean> => {
	const result = await db.prepare(
		'SELECT 1 FROM token_blacklist WHERE token = ? LIMIT 1'
	).bind(token).first();

	return result !== null;
};

/**
 * Clean expired tokens from blacklist (maintenance)
 */
export const cleanExpiredTokens = async (db: D1Database): Promise<void> => {
	const now = new Date().toISOString();

	await db.prepare(
		'DELETE FROM token_blacklist WHERE expires_at < ?'
	).bind(now).run();
};

/**
 * Memory-based blacklist (for development/small scale)
 * WARNING: This will be lost on worker restart
 */
class MemoryBlacklist {
	private blacklist = new Set<string>();
	private expiryMap = new Map<string, number>();

	add(token: string, expiresAt: Date): void {
		this.blacklist.add(token);
		this.expiryMap.set(token, expiresAt.getTime());
	}

	isBlacklisted(token: string): boolean {
		// Clean expired tokens
		this.cleanExpired();
		return this.blacklist.has(token);
	}

	private cleanExpired(): void {
		const now = Date.now();
		for (const [token, expiry] of this.expiryMap.entries()) {
			if (expiry < now) {
				this.blacklist.delete(token);
				this.expiryMap.delete(token);
			}
		}
	}
}

// Global memory blacklist instance
export const memoryBlacklist = new MemoryBlacklist();
