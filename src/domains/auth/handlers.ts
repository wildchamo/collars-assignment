import { IRequest } from 'itty-router';
import { AuthResponse, LoginRequest, AuthUser } from '../../shared/types';
import { generateJWT } from '../../shared/jwt.utils';
import { userQueries } from '../../shared/database.utils';
import { isValidEmail, isValidPassword } from '../../shared/validation.utils';
import { errorResponses, successResponses } from '../../shared/response.utils';

/**
 * Login handler - Authenticate user and return JWT token
 */
export const loginHandler = async (request: IRequest): Promise<Response> => {
	try {
		// Get parsed body from middleware
		const { email, password } = (request as any).parsedBody as LoginRequest;
		const { JWT_TOKEN, DB } = request.env as Env;

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

		// Generate JWT token using utility
		const token = await generateJWT(authUser, JWT_TOKEN);

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
 * Logout handler - Invalidate user session
 */
export const logoutHandler = async (request: IRequest): Promise<Response> => {
	try {
		// In a real implementation, you would:
		// 1. Extract token from Authorization header using extractTokenFromHeader
		// 2. Add token to a blacklist/invalidate it
		// 3. Clear any server-side sessions

		return successResponses.ok({ message: 'Logged out successfully' });

	} catch (error) {
		console.error('Logout error:', error);
		return errorResponses.internalError();
	}
};
