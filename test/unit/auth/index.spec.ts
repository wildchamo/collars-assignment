import {
	createExecutionContext, waitOnExecutionContext
} from 'cloudflare:test';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authRouter } from '../../../src/domains/auth/router';

// For now, you'll need to do something like this to get a correctly-typed
// `Request` to pass to `worker.fetch()`.
const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe('Auth Router', () => {
	let mockEnv: Env;
	let mockCtx: ExecutionContext;

	beforeEach(() => {
		// Reset all mocks before each test
		vi.clearAllMocks();

		// Mock environment
		mockEnv = {
			JWT_TOKEN: 'mock-jwt-secret',
			DB: {} as any,
			FREE_USER_RATE_LIMITER: {
				limit: vi.fn().mockResolvedValue({ success: true })
			},
			LOGGED_USER_RATE_LIMITER: {
				limit: vi.fn().mockResolvedValue({ success: true })
			}
		} as Env;

		// Mock execution context
		mockCtx = createExecutionContext();
	});

	describe('POST /auth/login', () => {
		it('should accept valid login request with email and password', async () => {
			const request = new IncomingRequest('http://example.com/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: 'test@example.com',
					password: 'validPassword123!'
				})
			});

			const response = await authRouter.fetch(request, mockEnv, mockCtx);
			await waitOnExecutionContext(mockCtx);

			// Should not return 404 (route exists)
			expect(response.status).not.toBe(404);
		});


		it('should reject request without email field', async () => {
			const request = new IncomingRequest('http://example.com/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					password: 'validPassword123!'
				})
			});

			const response = await authRouter.fetch(request, mockEnv, mockCtx);
			await waitOnExecutionContext(mockCtx);

			expect(response.status).toBe(400);
		});

		it('should reject request without password field', async () => {
			const request = new IncomingRequest('http://example.com/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: 'test@example.com'
				})
			});

			const response = await authRouter.fetch(request, mockEnv, mockCtx);
			await waitOnExecutionContext(mockCtx);

			expect(response.status).toBe(400);
		});

		it('should reject request with invalid email format', async () => {
			const request = new IncomingRequest('http://example.com/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: 'invalid-email',
					password: 'validPassword123!'
				})
			});

			const response = await authRouter.fetch(request, mockEnv, mockCtx);
			await waitOnExecutionContext(mockCtx);

			expect(response.status).toBe(400);
		});

		it('should reject GET requests to /auth/login', async () => {
			const request = new IncomingRequest('http://example.com/auth/login', {
				method: 'GET'
			});

			const response = await authRouter.fetch(request, mockEnv, mockCtx);
			await waitOnExecutionContext(mockCtx);

			expect(response.status).toBe(404);
		});
	});

	describe('POST /auth/logout', () => {
		it('should reject request without authorization token', async () => {
			const request = new IncomingRequest('http://example.com/auth/logout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});

			const response = await authRouter.fetch(request, mockEnv, mockCtx);
			await waitOnExecutionContext(mockCtx);

			expect(response.status).toBe(401);
		});

		it('should accept request with valid authorization token', async () => {
			const request = new IncomingRequest('http://example.com/auth/logout', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'authorization': 'valid-jwt-token'
				}
			});

			const response = await authRouter.fetch(request, mockEnv, mockCtx);
			await waitOnExecutionContext(mockCtx);

			// Should not return 401 if auth header is present (middleware will handle validation)
			expect(response.status).not.toBe(404);
		});

		it('should reject GET requests to /auth/logout', async () => {
			const request = new IncomingRequest('http://example.com/auth/logout', {
				method: 'GET',
				headers: {
					'authorization': 'valid-jwt-token'
				}
			});

			const response = await authRouter.fetch(request, mockEnv, mockCtx);
			await waitOnExecutionContext(mockCtx);

			expect(response.status).toBe(404);
		});

		it('should reject PUT requests to /auth/logout', async () => {
			const request = new IncomingRequest('http://example.com/auth/logout', {
				method: 'PUT',
				headers: {
					'authorization': 'valid-jwt-token'
				}
			});

			const response = await authRouter.fetch(request, mockEnv, mockCtx);
			await waitOnExecutionContext(mockCtx);

			expect(response.status).toBe(404);
		});
	});

	describe('Router Configuration', () => {
		it('should return 404 for non-existent auth routes', async () => {
			const request = new IncomingRequest('http://example.com/auth/nonexistent', {
				method: 'GET'
			});

			const response = await authRouter.fetch(request, mockEnv, mockCtx);
			await waitOnExecutionContext(mockCtx);

			expect(response.status).toBe(404);
		});

		it('should return 404 for /auth root path without specific endpoint', async () => {
			const request = new IncomingRequest('http://example.com/auth', {
				method: 'GET'
			});

			const response = await authRouter.fetch(request, mockEnv, mockCtx);
			await waitOnExecutionContext(mockCtx);

			expect(response.status).toBe(404);
		});

		it('should handle base path correctly for login', async () => {
			const request = new IncomingRequest('http://example.com/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: 'test@example.com',
					password: 'validPassword123!'
				})
			});

			const response = await authRouter.fetch(request, mockEnv, mockCtx);
			await waitOnExecutionContext(mockCtx);

			// Should not be 404, meaning the route is matched correctly
			expect(response.status).not.toBe(404);
		});

		it('should handle base path correctly for logout', async () => {
			const request = new IncomingRequest('http://example.com/auth/logout', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'authorization': 'valid-jwt-token'
				}
			});

			const response = await authRouter.fetch(request, mockEnv, mockCtx);
			await waitOnExecutionContext(mockCtx);

			// Should not be 404, meaning the route is matched correctly
			expect(response.status).not.toBe(404);
		});
	});
});
