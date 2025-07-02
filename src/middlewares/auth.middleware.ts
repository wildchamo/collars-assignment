import { IRequest } from 'itty-router';
import { ApiResponse } from '../shared/types';
import { verifyJWT } from '../shared/jwt.utils';
import { errorResponses } from '../shared/response.utils';

/**
 * Middleware to verify JWT token and attach user info to request
 */
export const requireAuth = async (request: IRequest, env: Env): Promise<Response | void> => {
	try {
		const { JWT_TOKEN, DB } = env as Env;

		// Extract token from Authorization header
		const token = request.headers.get('authorization');

		console.log(token)

		if (!token) {
			return errorResponses.unauthorized('No token provided');
		}

		// Verify token and validate version
		const payload = await verifyJWT(token, JWT_TOKEN, DB);

		if (!payload) {
			return errorResponses.unauthorized('Invalid or expired token');
		}


		// Attach user info to request for next handlers
		(request as any).user = {
			id: payload.userId,
			email: payload.email,
			role: payload.role,
			tokenVersion: payload.tokenVersion
		};

		// Attach raw token to request (useful for logout)
		(request as any).token = token;

	} catch (error) {
		console.error('Auth middleware error:', error);
		return errorResponses.internalError('Authentication failed');
	}
	// If successful, continue to next handler
};

/**
 * Middleware to check if user has admin role
 * Should be used AFTER requireAuth middleware
 */
export const requireAdmin = async (request: IRequest, env: Env, ctx: ExecutionContext): Promise<Response | void> => {
	// First run requireAuth to extract and validate user info

	await requireAuth(request, env);

	// At this point, user info should be attached to request by requireAuth
	const user = (request as any).user;

	if (!user) {
		return errorResponses.unauthorized('Authentication required');
	}

	if (user.role !== 'admin') {
		return errorResponses.forbidden('Admin access required');
	}

	// If user is admin, continue to next handler
};
