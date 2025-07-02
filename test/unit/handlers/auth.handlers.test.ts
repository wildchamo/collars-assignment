import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loginHandler, logoutHandler } from '../../../src/domains/auth/handlers';
import { createMockRequest, createMockEnv } from '../../mocks/cloudflare.mock';
import { IRequest } from 'itty-router';
// Mock the utilities
vi.mock('../../../src/shared/jwt.utils', () => ({
	generateJWT: vi.fn().mockResolvedValue('mock-jwt-token'),
	verifyJWT: vi.fn().mockResolvedValue({ userId: 'user-123' }),
}));

vi.mock('../../../src/shared/database.utils', () => ({
	userQueries: {
		findByEmail: vi.fn(),
	},
}));

vi.mock('../../../src/shared/validation.utils', () => ({
	isValidEmail: vi.fn(),
	isValidPassword: vi.fn(),
}));

vi.mock('../../../src/shared/token-versioning.utils', () => ({
	logoutUserAllDevices: vi.fn().mockResolvedValue(undefined),
}));

import { userQueries } from '../../../src/shared/database.utils';
import { isValidEmail, isValidPassword } from '../../../src/shared/validation.utils';
import { generateJWT, verifyJWT } from '../../../src/shared/jwt.utils';
import { logoutUserAllDevices } from '../../../src/shared/token-versioning.utils';

describe('Auth Handlers', () => {
	let mockEnv: Env;

	beforeEach(() => {
		mockEnv = createMockEnv();
		vi.clearAllMocks();
	});

	describe('loginHandler', () => {
		const validLoginData = {
			email: 'test@example.com',
			password: 'ValidPass123!',
		};

		const mockUser = {
			id: 'user-123',
			name: 'Test User',
			email: 'test@example.com',
			password: 'ValidPass123!',
			role: 'user' as const,
		};

		it('should login successfully with valid credentials', async () => {
			const request = createMockRequest(
				'https://example.com/auth/login',
				'POST',
				validLoginData
			);

			// Mock validation and database responses
			vi.mocked(isValidEmail).mockReturnValue(true);
			vi.mocked(isValidPassword).mockReturnValue({ isValid: true });
			vi.mocked(userQueries.findByEmail).mockResolvedValue(mockUser);

			const response = await loginHandler(request as IRequest, mockEnv);

			expect(response.status).toBe(200);
			const body = await response.json() as any;
			expect(body.success).toBe(true);
			expect(body.data.token).toBe('mock-jwt-token');

			expect(generateJWT).toHaveBeenCalledWith({
				id: 'user-123',
				name: 'Test User',
				email: 'test@example.com',
				role: 'user',
			}, mockEnv.JWT_TOKEN, mockEnv.DB);
		});

		it('should return 400 for invalid email format', async () => {
			const request = createMockRequest(
				'https://example.com/auth/login',
				'POST',
				{ ...validLoginData, email: 'invalid-email' }
			);

			vi.mocked(isValidEmail).mockReturnValue(false);

			const response = await loginHandler(request, mockEnv);

			expect(response.status).toBe(400);
			const body = await response.json() as any;
			expect(body.success).toBe(false);
			expect(body.error).toBe('Invalid email format');
		});

		it('should return 400 for invalid password', async () => {
			const request = createMockRequest(
				'https://example.com/auth/login',
				'POST',
				{ ...validLoginData, password: 'weak' }
			);

			vi.mocked(isValidEmail).mockReturnValue(true);
			vi.mocked(isValidPassword).mockReturnValue({
				isValid: false,
				message: 'Password must be at least 8 characters',
			});

			const response = await loginHandler(request, mockEnv);

			expect(response.status).toBe(400);
			const body = await response.json() as any;
			expect(body.success).toBe(false);
			expect(body.error).toBe('Password must be at least 8 characters');
		});

		it('should return 401 for unregistered email', async () => {
			const request = createMockRequest(
				'https://example.com/auth/login',
				'POST',
				validLoginData
			);

			vi.mocked(isValidEmail).mockReturnValue(true);
			vi.mocked(isValidPassword).mockReturnValue({ isValid: true });
			vi.mocked(userQueries.findByEmail).mockResolvedValue(null);

			const response = await loginHandler(request, mockEnv);

			expect(response.status).toBe(401);
			const body = await response.json() as any;
			expect(body.success).toBe(false);
			expect(body.error).toBe('This email is not registered');
		});

		it('should return 401 for incorrect password', async () => {
			const request = createMockRequest(
				'https://example.com/auth/login',
				'POST',
				{ ...validLoginData, password: 'WrongPassword123!' }
			);

			vi.mocked(isValidEmail).mockReturnValue(true);
			vi.mocked(isValidPassword).mockReturnValue({ isValid: true });
			vi.mocked(userQueries.findByEmail).mockResolvedValue(mockUser);

			const response = await loginHandler(request, mockEnv);

			expect(response.status).toBe(401);
			const body = await response.json() as any;
			expect(body.success).toBe(false);
			expect(body.error).toBe('Invalid credentials');
		});

		it('should return 500 on internal error', async () => {
			const request = createMockRequest(
				'https://example.com/auth/login',
				'POST',
				validLoginData
			);

			vi.mocked(isValidEmail).mockImplementation(() => {
				throw new Error('Database connection failed');
			});

			const response = await loginHandler(request, mockEnv);

			expect(response.status).toBe(500);
			const body = await response.json() as any;
			expect(body.success).toBe(false);
			expect(body.error).toBe('Internal server error');
		});
	});

	describe('logoutHandler', () => {
		it('should logout successfully with valid token', async () => {
			const token = 'valid-jwt-token';
			const request = createMockRequest(
				'https://example.com/auth/logout',
				'POST',
				undefined,
				{ Authorization: `Bearer ${token}` }
			);

			const response = await logoutHandler(request, mockEnv);

			expect(response.status).toBe(200);
			const body = await response.json() as any;
			expect(body.success).toBe(true);
			expect(body.data.message).toBe('Logged out successfully from all devices');

			expect(verifyJWT).toHaveBeenCalledWith(token, mockEnv.JWT_TOKEN, mockEnv.DB);
			expect(logoutUserAllDevices).toHaveBeenCalledWith(mockEnv.DB, 'user-123');
		});

		it('should return 401 when no token provided', async () => {
			const request = createMockRequest('https://example.com/auth/logout', 'POST');

			const response = await logoutHandler(request, mockEnv);

			expect(response.status).toBe(401);
			const body = await response.json() as any;
			expect(body.success).toBe(false);
			expect(body.error).toBe('No token provided');
		});

		it('should return 401 when token is invalid', async () => {
			const token = 'invalid-jwt-token';
			const request = createMockRequest(
				'https://example.com/auth/logout',
				'POST',
				undefined,
				{ Authorization: `Bearer ${token}` }
			);

			vi.mocked(verifyJWT).mockResolvedValue(null);

			const response = await logoutHandler(request, mockEnv);

			expect(response.status).toBe(401);
			const body = await response.json() as any;
			expect(body.success).toBe(false);
			expect(body.error).toBe('Invalid token');
		});

		it('should return 500 on internal error', async () => {
			const token = 'valid-jwt-token';
			const request = createMockRequest(
				'https://example.com/auth/logout',
				'POST',
				undefined,
				{ Authorization: `Bearer ${token}` }
			);

			vi.mocked(verifyJWT).mockImplementation(() => {
				throw new Error('JWT verification failed');
			});

			const response = await logoutHandler(request, mockEnv);

			expect(response.status).toBe(500);
			const body = await response.json() as any;
			expect(body.success).toBe(false);
			expect(body.error).toBe('Internal server error');
		});
	});
});
