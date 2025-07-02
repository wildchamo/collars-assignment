import { describe, it, expect } from 'vitest';
import {
	createSuccessResponse,
	createErrorResponse,
	errorResponses,
	successResponses,
	createValidationErrorResponse,
} from '../../../src/shared/response.utils';

describe('Response Utils', () => {
	describe('createSuccessResponse', () => {
		it('should create a success response with default status 200', async () => {
			const data = { message: 'test' };
			const response = createSuccessResponse(data);

			expect(response.status).toBe(200);
			expect(response.headers.get('Content-Type')).toBe('application/json');

			const body = await response.json();
			expect(body).toEqual({
				success: true,
				data: { message: 'test' },
			});
		});

		it('should create a success response with custom status', async () => {
			const data = { id: 1 };
			const response = createSuccessResponse(data, 201);

			expect(response.status).toBe(201);
			const body = await response.json();
			expect(body).toEqual({
				success: true,
				data: { id: 1 },
			});
		});
	});

	describe('createErrorResponse', () => {
		it('should create an error response with default status 400', async () => {
			const response = createErrorResponse('Test error');

			expect(response.status).toBe(400);
			expect(response.headers.get('Content-Type')).toBe('application/json');

			const body = await response.json();
			expect(body).toEqual({
				success: false,
				error: 'Test error',
			});
		});

		it('should create an error response with custom status', async () => {
			const response = createErrorResponse('Server error', 500);

			expect(response.status).toBe(500);
			const body = await response.json();
			expect(body).toEqual({
				success: false,
				error: 'Server error',
			});
		});
	});

	describe('errorResponses', () => {
		it('should create badRequest response', async () => {
			const response = errorResponses.badRequest('Invalid input');
			expect(response.status).toBe(400);

			const body = await response.json() as any;
			expect(body.error).toBe('Invalid input');
		});

		it('should create unauthorized response', async () => {
			const response = errorResponses.unauthorized();
			expect(response.status).toBe(401);

			const body = await response.json() as any;
			expect(body.error).toBe('Unauthorized');
		});

		it('should create rateLimitExceeded response', async () => {
			const response = errorResponses.rateLimitExceeded();
			expect(response.status).toBe(429);

			const body = await response.json() as any;
			expect(body.error).toBe('Rate limit exceeded');
		});
	});

	describe('successResponses', () => {
		it('should create ok response', async () => {
			const data = { test: true };
			const response = successResponses.ok(data);

			expect(response.status).toBe(200);
			const body = await response.json() as any;
			expect(body.data).toEqual(data);
		});

		it('should create created response', async () => {
			const data = { id: 1 };
			const response = successResponses.created(data);

			expect(response.status).toBe(201);
			const body = await response.json() as any;
			expect(body.data).toEqual(data);
		});

		it('should create noContent response', () => {
			const response = successResponses.noContent();
			expect(response.status).toBe(204);
		});
	});

	describe('createValidationErrorResponse', () => {
		it('should create validation error response', async () => {
			const errors = ['Field required', 'Invalid format'];
			const response = createValidationErrorResponse(errors);

			expect(response.status).toBe(400);
			const body = await response.json() as any;
			expect(body.error).toBe('Validation failed: Field required, Invalid format');
		});
	});
});
