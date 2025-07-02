import { IRequest } from 'itty-router';
import { errorResponses } from '../shared/response.utils';

/**
 * Rate limiting middleware that controls request frequency per user
 *
 * This middleware implements a differentiated rate limiting system:
 * - Unauthenticated users: more restrictive limit (FREE_USER_RATE_LIMITER)
 * - Authenticated users: more permissive limit (LOGGED_USER_RATE_LIMITER)
 *
 * @returns Response with 429 error if limit is exceeded, or void to continue
 */
export const rateLimit = async (request: IRequest, env: Env, ctx: ExecutionContext): Promise<Response | void> => {
	// Extract rate limiters from Cloudflare Workers environment
	const { FREE_USER_RATE_LIMITER, LOGGED_USER_RATE_LIMITER } = env;

	// Get token from request (added by auth middleware if it exists)
	const token = (request as any).token || null;

	// Extract pathname from URL to create endpoint-specific keys
	const { pathname } = new URL(request.url);

	// Variable to store the unique rate limit key
	let key: string;

	if (!token) {
		// CASE: Unauthenticated user
		// Generate a key based on endpoint for free users
		// This means all unauthenticated users share the same limit per endpoint
		key = `${pathname}-free-user`;

		console.log(key)
		const { success } = await FREE_USER_RATE_LIMITER.limit({ key });

		// If limit is exceeded, return 429 error (Too Many Requests)
		if (!success) {
			return errorResponses.rateLimitExceeded();
		}
	} else {
		// CASE: Authenticated user
		// Generate a unique key combining endpoint and user token
		// This allows individual limits per authenticated user
		key = `${pathname}-logged-user-${token}`;
		const { success } = await LOGGED_USER_RATE_LIMITER.limit({ key });

		// If limit is exceeded, return 429 error (Too Many Requests)
		if (!success) {
			return errorResponses.rateLimitExceeded();
		}
	}

	// If no limits are exceeded, the middleware allows the request to continue
	// (implicitly returns void)
};