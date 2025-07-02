import { IRequest } from 'itty-router';
import { userQueries } from '../../shared/database.utils';
import { isValidEmail, isValidPassword } from '../../shared/validation.utils';
import { errorResponses, successResponses } from '../../shared/response.utils';

/**
 * Get all users handler
 */
export const getAllUsersHandler = async (request: IRequest, env: Env, ctx: ExecutionContext): Promise<Response> => {
	try {
		const { DB } = env as Env;

		const response = await DB.prepare('SELECT id, name, email, role, phone_number FROM users').all();

		const users = response.results;

		return successResponses.ok(users);
	} catch (error) {
		console.error('Get all users error:', error);
		return errorResponses.internalError();
	}
};

/**
 * Get user by ID handler
 */
export const getUserByIdHandler = async (request: IRequest, env: Env, ctx: ExecutionContext): Promise<Response> => {
	try {
		// Extract ID from route parameters - itty-router automatically parses :id into request.params.id
		const { id } = request.params;
		const { DB } = env as Env;

		if (!id) {
			return errorResponses.badRequest('User ID is required');
		}

		// Query user from database using userQueries utility
		const user = await userQueries.findById(DB, id);

		if (!user) {
			return errorResponses.notFound('User not found');
		}

		// Remove password from response for security
		const { password, ...userWithoutPassword } = user;

		return successResponses.ok(userWithoutPassword);

	} catch (error) {
		console.error('Get user by ID error:', error);
		return errorResponses.internalError();
	}
};

/**
 * Create user handler
 */
export const createUserHandler = async (request: IRequest, env: Env, ctx: ExecutionContext): Promise<Response> => {
	try {
		const { name, email, password, role, phoneNumber } = (request as any).parsedBody;
		const { DB } = env as Env;

		// Validate required fields
		if (!name || !email || !password) {
			return errorResponses.badRequest('Name, email and password are required');
		}

		// Validate email format
		if (!isValidEmail(email)) {
			return errorResponses.badRequest('Invalid email format');
		}

		// Validate password
		const passwordValidation = isValidPassword(password);
		if (!passwordValidation.isValid) {
			return errorResponses.badRequest(passwordValidation.message!);
		}

		// Check if user already exists
		const existingUser = await userQueries.findByEmail(DB, email);
		if (existingUser) {
			return errorResponses.badRequest('User with this email already exists');
		}

		// Validate role if provided
		if (role && !['admin', 'user'].includes(role)) {
			return errorResponses.badRequest('Invalid role. Must be either "admin" or "user"');
		}

		// Insert user into database
		const result = await DB.prepare(
			'INSERT INTO users (name, email, password, role, phone_number) VALUES (?, ?, ?, ?, ?)'
		).bind(
			name,
			email,
			password,
			role || 'user', // Default to 'user' if no role provided
			phoneNumber || null
		).run();

		if (!result.success) {
			return errorResponses.internalError('Failed to create user');
		}

		// Return success response
		return successResponses.created({
			id: result.meta?.last_row_id,
			name,
			email,
			role: role || 'user',
			phoneNumber: phoneNumber || null
		});

	} catch (error) {
		console.error('Create user error:', error);
		return errorResponses.internalError();
	}
};
