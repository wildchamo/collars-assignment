import { vi } from 'vitest';

// Mock for Cloudflare D1 Database
export const createMockDB = () => ({
	prepare: vi.fn().mockReturnValue({
		bind: vi.fn().mockReturnValue({
			first: vi.fn(),
			all: vi.fn(),
			run: vi.fn(),
		}),
		first: vi.fn(),
		all: vi.fn(),
		run: vi.fn(),
	}),
	exec: vi.fn(),
	batch: vi.fn(),
});

// Mock for Rate Limiter
export const createMockRateLimiter = () => ({
	limit: vi.fn().mockResolvedValue({ success: true }),
});

// Mock environment
export const createMockEnv = (): Env => ({
	DB: createMockDB() as any,
	JWT_TOKEN: 'test-jwt-secret',
	FREE_USER_RATE_LIMITER: createMockRateLimiter() as any,
	LOGGED_USER_RATE_LIMITER: createMockRateLimiter() as any,
});

// Mock execution context
export const createMockContext = (): ExecutionContext => ({
	waitUntil: vi.fn(),
	passThroughOnException: vi.fn(),
	props: {},
});

// Mock request factory
export const createMockRequest = (
	url: string = 'https://example.com',
	method: string = 'GET',
	body?: any,
	headers?: Record<string, string>
) => {
	const request = new Request(url, {
		method,
		body: body ? JSON.stringify(body) : undefined,
		headers: {
			'Content-Type': 'application/json',
			...headers,
		},
	});

	// Add itty-router properties
	(request as any).parsedBody = body;
	(request as any).token = headers?.['Authorization']?.replace('Bearer ', '');
	(request as any).route = new URL(url).pathname;
	(request as any).params = {};
	(request as any).query = {};

	return request;
};
