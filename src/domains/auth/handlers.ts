import { IRequest } from 'itty-router';
import { AuthResponse, LoginRequest, AuthUser } from '../../shared/types';
import { generateJWT, verifyJWT } from '../../shared/jwt.utils';
import { userQueries } from '../../shared/database.utils';
import { isValidEmail, isValidPassword } from '../../shared/validation.utils';
import { errorResponses, successResponses } from '../../shared/response.utils';
import { logoutUserAllDevices } from '../../shared/token-versioning.utils';

/**
 * Login handler - Authenticate user and return JWT token
 */
export const loginHandler = async (request: IRequest, env: Env): Promise<Response> => {
	try {
		// Get parsed body from middleware
		const { email, password } = (request as any).parsedBody as LoginRequest;
		const { JWT_TOKEN, DB } = env as Env;

		// Validate email format
		if (!isValidEmail(email)) {
			return errorResponses.badRequest('Invalid email format');
		}

		// Validate password
		const passwordValidation = isValidPassword(password);
		if (!passwordValidation.isValid) {
			return errorResponses.badRequest(passwordValidation.message!);
		}

		// Query user from database using utility
		const userQuery = await userQueries.findByEmail(DB, email);

		if (!userQuery) {
			return errorResponses.unauthorized('This email is not registered');
		}

		// Simple password check (in production, use proper hashing)
		if (userQuery.password !== password) {
			return errorResponses.unauthorized('Invalid credentials');
		}

		// Create auth user object
		const authUser: AuthUser = {
			id: userQuery.id as string,
			name: userQuery.name as string,
			email: userQuery.email as string,
			role: userQuery.role as 'admin' | 'user'
		};

		// Generate JWT token with versioning
		const token = await generateJWT(authUser, JWT_TOKEN, DB);

		const authResponse: AuthResponse = {
			token: token
		};

		return successResponses.ok(authResponse);

	} catch (error) {
		console.error('Login error:', error);
		return errorResponses.internalError();
	}
};

/**
 * Logout handler - Invalidate user session using token versioning
 */
export const logoutHandler = async (request: IRequest, env: Env): Promise<Response> => {
	try {
		const { JWT_TOKEN, DB } = env;

		const token = (request as any).token;

		console.log(token)
		if (!token) {
			return errorResponses.unauthorized('No token provided');
		}

		// Verify token and get user info
		const payload = await verifyJWT(token, JWT_TOKEN, DB);
		if (!payload) {
			return errorResponses.unauthorized('Invalid token');
		}

		// Invalidate all user tokens by incrementing token version
		await logoutUserAllDevices(DB, payload.userId);

		return successResponses.ok({ message: 'Logged out successfully from all devices' });

	} catch (error) {
		console.error('Logout error:', error);
		return errorResponses.internalError();
	}
};
