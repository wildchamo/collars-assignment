import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rateLimit } from '../../../src/middlewares/rate-limit.middleware';
import { createMockRequest, createMockEnv, createMockContext } from '../../mocks/cloudflare.mock';

describe('Rate Limit Middleware', () => {
    let mockEnv: Env;
    let mockContext: ExecutionContext;

    beforeEach(() => {
        mockEnv = createMockEnv();
        mockContext = createMockContext();
        vi.clearAllMocks();
    });

    describe('when user is not authenticated', () => {
        it('should use FREE_USER_RATE_LIMITER with correct key', async () => {
            const request = createMockRequest('https://example.com/api/tasks', 'GET');

            // Mock successful rate limit
            mockEnv.FREE_USER_RATE_LIMITER.limit = vi.fn().mockResolvedValue({ success: true });

            const result = await rateLimit(request, mockEnv, mockContext);

            expect(mockEnv.FREE_USER_RATE_LIMITER.limit).toHaveBeenCalledWith('/api/tasks-free-user');
            expect(mockEnv.LOGGED_USER_RATE_LIMITER.limit).not.toHaveBeenCalled();
            expect(result).toBeUndefined(); // Should allow request to continue
        });

        it('should return 429 error when rate limit is exceeded', async () => {
            const request = createMockRequest('https://example.com/api/users', 'GET');

            // Mock rate limit exceeded
            mockEnv.FREE_USER_RATE_LIMITER.limit = vi.fn().mockResolvedValue({ success: false });

            const result = await rateLimit(request, mockEnv, mockContext);

            expect(result).toBeInstanceOf(Response);
            expect((result as Response).status).toBe(429);

            const body = await (result as Response).json() as any;
            expect(body.success).toBe(false);
            expect(body.error).toBe('Rate limit exceeded');
        });
    });

    describe('when user is authenticated', () => {
        it('should use LOGGED_USER_RATE_LIMITER with correct key including token', async () => {
            const token = 'mock-jwt-token';
            const request = createMockRequest(
                'https://example.com/api/tasks',
                'POST',
                { title: 'New Task' },
                { Authorization: `Bearer ${token}` }
            );

            // Mock successful rate limit
            mockEnv.LOGGED_USER_RATE_LIMITER.limit = vi.fn().mockResolvedValue({ success: true });

            const result = await rateLimit(request, mockEnv, mockContext);

            expect(mockEnv.LOGGED_USER_RATE_LIMITER.limit).toHaveBeenCalledWith(`/api/tasks-logged-user-${token}`);
            expect(mockEnv.FREE_USER_RATE_LIMITER.limit).not.toHaveBeenCalled();
            expect(result).toBeUndefined(); // Should allow request to continue
        });

        it('should return 429 error when authenticated user exceeds rate limit', async () => {
            const token = 'mock-jwt-token';
            const request = createMockRequest(
                'https://example.com/api/users',
                'GET',
                undefined,
                { Authorization: `Bearer ${token}` }
            );

            // Mock rate limit exceeded
            mockEnv.LOGGED_USER_RATE_LIMITER.limit = vi.fn().mockResolvedValue({ success: false });

            const result = await rateLimit(request, mockEnv, mockContext);

            expect(result).toBeInstanceOf(Response);
            expect((result as Response).status).toBe(429);
        });
    });

    describe('key generation', () => {
        it('should generate different keys for different endpoints', async () => {
            const request1 = createMockRequest('https://example.com/api/tasks', 'GET');
            const request2 = createMockRequest('https://example.com/api/users', 'GET');

            mockEnv.FREE_USER_RATE_LIMITER.limit = vi.fn().mockResolvedValue({ success: true });

            await rateLimit(request1, mockEnv, mockContext);
            await rateLimit(request2, mockEnv, mockContext);

            expect(mockEnv.FREE_USER_RATE_LIMITER.limit).toHaveBeenCalledWith('/api/tasks-free-user');
            expect(mockEnv.FREE_USER_RATE_LIMITER.limit).toHaveBeenCalledWith('/api/users-free-user');
        });

        it('should generate user-specific keys for authenticated users', async () => {
            const token1 = 'user1-token';
            const token2 = 'user2-token';

            const request1 = createMockRequest(
                'https://example.com/api/tasks',
                'GET',
                undefined,
                { Authorization: `Bearer ${token1}` }
            );
            const request2 = createMockRequest(
                'https://example.com/api/tasks',
                'GET',
                undefined,
                { Authorization: `Bearer ${token2}` }
            );

            mockEnv.LOGGED_USER_RATE_LIMITER.limit = vi.fn().mockResolvedValue({ success: true });

            await rateLimit(request1, mockEnv, mockContext);
            await rateLimit(request2, mockEnv, mockContext);

            expect(mockEnv.LOGGED_USER_RATE_LIMITER.limit).toHaveBeenCalledWith(`/api/tasks-logged-user-${token1}`);
            expect(mockEnv.LOGGED_USER_RATE_LIMITER.limit).toHaveBeenCalledWith(`/api/tasks-logged-user-${token2}`);
        });
    });
});
