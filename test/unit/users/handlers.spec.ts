import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createExecutionContext } from 'cloudflare:test';
import { getAllUsersHandler, getUserByIdHandler, createUserHandler } from '../../../src/domains/users/handlers';

// Mock database utilities
vi.mock('../../../src/shared/database.utils', () => ({
	userQueries: {
		findById: vi.fn(),
		findByEmail: vi.fn()
	}
}));

// Mock validation utilities
vi.mock('../../../src/shared/validation.utils', () => ({
	isValidEmail: vi.fn(),
	isValidPassword: vi.fn()
}));

describe('Users Handlers', () => {
	let mockEnv: Env;
	let mockCtx: ExecutionContext;

	beforeEach(() => {
		vi.clearAllMocks();

		mockCtx = createExecutionContext();

		mockEnv = {
			DB: {
				prepare: vi.fn().mockReturnThis(),
				bind: vi.fn().mockReturnThis(),
				all: vi.fn(),
				run: vi.fn()
			}
		} as any;
	});

	describe('getAllUsersHandler', () => {
		it('should return all users successfully', async () => {
			const mockUsers = [
				{ id: '1', name: 'Admin User', email: 'admin@test.com', role: 'admin', phone_number: null },
				{ id: '2', name: 'Regular User', email: 'user@test.com', role: 'user', phone_number: '+123456789' }
			];

			vi.mocked(mockEnv.DB.prepare).mockReturnValue({
				all: vi.fn().mockResolvedValue({
					results: mockUsers
				})
			} as any);

			const mockRequest = {} as any;

			const response = await getAllUsersHandler(mockRequest, mockEnv, mockCtx);
			const responseData = await response.json() as any;

			expect(response.status).toBe(200);
			expect(responseData.success).toBe(true);
			expect(responseData.data).toEqual(mockUsers);
			expect(mockEnv.DB.prepare).toHaveBeenCalledWith('SELECT id, name, email, role, phone_number FROM users');
		});

		it('should handle database errors gracefully', async () => {
			vi.mocked(mockEnv.DB.prepare).mockReturnValue({
				all: vi.fn().mockRejectedValue(new Error('Database connection failed'))
			} as any);

			const mockRequest = {} as any;

			const response = await getAllUsersHandler(mockRequest, mockEnv, mockCtx);
			const responseData = await response.json() as any;

			expect(response.status).toBe(500);
			expect(responseData.success).toBe(false);
			expect(responseData.error).toBe('Internal server error');
		});
	});

	describe('getUserByIdHandler', () => {
		it('should return user by ID successfully', async () => {
			const { userQueries } = await import('../../../src/shared/database.utils');

			const mockUser = {
				id: 'user123',
				name: 'Test User',
				email: 'test@example.com',
				role: 'user',
				phone_number: '+123456789',
				password: 'hashedPassword'
			};

			vi.mocked(userQueries.findById).mockResolvedValue(mockUser);

			const mockRequest = {
				params: { id: 'user123' }
			} as any;

			const response = await getUserByIdHandler(mockRequest, mockEnv, mockCtx);
			const responseData = await response.json() as any;

			expect(response.status).toBe(200);
			expect(responseData.success).toBe(true);
			expect(responseData.data).toEqual({
				id: 'user123',
				name: 'Test User',
				email: 'test@example.com',
				role: 'user',
				phone_number: '+123456789'
				// password should be excluded
			});
			expect(responseData.data).not.toHaveProperty('password');
		});

		it('should return 400 when user ID is missing', async () => {
			const mockRequest = {
				params: {}
			} as any;

			const response = await getUserByIdHandler(mockRequest, mockEnv, mockCtx);
			const responseData = await response.json() as any;

			expect(response.status).toBe(400);
			expect(responseData.success).toBe(false);
			expect(responseData.error).toBe('User ID is required');
		});

		it('should return 404 when user is not found', async () => {
			const { userQueries } = await import('../../../src/shared/database.utils');

			vi.mocked(userQueries.findById).mockResolvedValue(null);

			const mockRequest = {
				params: { id: 'nonexistent' }
			} as any;

			const response = await getUserByIdHandler(mockRequest, mockEnv, mockCtx);
			const responseData = await response.json() as any;

			expect(response.status).toBe(404);
			expect(responseData.success).toBe(false);
			expect(responseData.error).toBe('User not found');
		});
	});

	describe('createUserHandler', () => {
		it('should create user successfully', async () => {
			const { userQueries } = await import('../../../src/shared/database.utils');
			const { isValidEmail, isValidPassword } = await import('../../../src/shared/validation.utils');

			// Mock validation functions
			vi.mocked(isValidEmail).mockReturnValue(true);
			vi.mocked(isValidPassword).mockReturnValue({ isValid: true });

			// Mock user doesn't exist
			vi.mocked(userQueries.findByEmail).mockResolvedValue(null);

			// Mock successful database insertion
			vi.mocked(mockEnv.DB.prepare).mockReturnValue({
				bind: vi.fn().mockReturnThis(),
				run: vi.fn().mockResolvedValue({
					success: true,
					meta: { last_row_id: 'new-user-123' }
				})
			} as any);

			const mockRequest = {
				parsedBody: {
					name: 'New User',
					email: 'newuser@example.com',
					password: 'ValidPassword123!',
					role: 'user',
					phoneNumber: '+1234567890'
				}
			} as any;

			const response = await createUserHandler(mockRequest, mockEnv, mockCtx);
			const responseData = await response.json() as any;

			expect(response.status).toBe(201);

			expect(responseData.success).toBe(true);
			expect(responseData.data).toEqual({
				id: 'new-user-123',
				name: 'New User',
				email: 'newuser@example.com',
				role: 'user',
				phoneNumber: '+1234567890'
			});
		});

		it('should return 400 when required fields are missing', async () => {
			const mockRequest = {
				parsedBody: {
					name: 'New User',
					// missing email and password
				}
			} as any;

			const response = await createUserHandler(mockRequest, mockEnv, mockCtx);
			const responseData = await response.json() as any;

			expect(response.status).toBe(400);
			expect(responseData.success).toBe(false);
			expect(responseData.error).toBe('Name, email and password are required');
		});

		it('should return 400 when email format is invalid', async () => {
			const { isValidEmail } = await import('../../../src/shared/validation.utils');

			vi.mocked(isValidEmail).mockReturnValue(false);

			const mockRequest = {
				parsedBody: {
					name: 'New User',
					email: 'invalid-email',
					password: 'ValidPassword123!'
				}
			} as any;

			const response = await createUserHandler(mockRequest, mockEnv, mockCtx);
			const responseData = await response.json() as any;

			expect(response.status).toBe(400);
			expect(responseData.success).toBe(false);
			expect(responseData.error).toBe('Invalid email format');
		});

		it('should return 400 when password is invalid', async () => {
			const { isValidEmail, isValidPassword } = await import('../../../src/shared/validation.utils');

			vi.mocked(isValidEmail).mockReturnValue(true);
			vi.mocked(isValidPassword).mockReturnValue({
				isValid: false,
				message: 'Password must be at least 8 characters long'
			});

			const mockRequest = {
				parsedBody: {
					name: 'New User',
					email: 'valid@example.com',
					password: '123'
				}
			} as any;

			const response = await createUserHandler(mockRequest, mockEnv, mockCtx);
			const responseData = await response.json() as any;

			expect(response.status).toBe(400);
			expect(responseData.success).toBe(false);
			expect(responseData.error).toBe('Password must be at least 8 characters long');
		});

		it('should return 400 when user with email already exists', async () => {
			const { userQueries } = await import('../../../src/shared/database.utils');
			const { isValidEmail, isValidPassword } = await import('../../../src/shared/validation.utils');

			vi.mocked(isValidEmail).mockReturnValue(true);
			vi.mocked(isValidPassword).mockReturnValue({ isValid: true });

			// Mock user already exists
			vi.mocked(userQueries.findByEmail).mockResolvedValue({
				id: 'existing-user',
				email: 'existing@example.com'
			} as any);

			const mockRequest = {
				parsedBody: {
					name: 'New User',
					email: 'existing@example.com',
					password: 'ValidPassword123!'
				}
			} as any;

			const response = await createUserHandler(mockRequest, mockEnv, mockCtx);
			const responseData = await response.json() as any;

			expect(response.status).toBe(400);
			expect(responseData?.success).toBe(false);
			expect(responseData?.error).toBe('User with this email already exists');
		});
	});
});
