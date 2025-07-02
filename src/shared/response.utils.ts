import { ApiResponse } from './types';

/**
 * Create success response
 */
export const createSuccessResponse = <T>(data: T, status: number = 200): Response => {
	const response: ApiResponse<T> = {
		success: true,
		data
	};

	return new Response(JSON.stringify(response), {
		status,
		headers: { 'Content-Type': 'application/json' }
	});
};

/**
 * Create error response
 */
export const createErrorResponse = (error: string, status: number = 400): Response => {
	const response: ApiResponse = {
		success: false,
		error
	};

	return new Response(JSON.stringify(response), {
		status,
		headers: { 'Content-Type': 'application/json' }
	});
};

/**
 * Common error responses
 */
export const errorResponses = {
	badRequest: (message: string = 'Bad request') => createErrorResponse(message, 400),
	unauthorized: (message: string = 'Unauthorized') => createErrorResponse(message, 401),
	forbidden: (message: string = 'Forbidden') => createErrorResponse(message, 403),
	notFound: (message: string = 'Not found') => createErrorResponse(message, 404),
	conflict: (message: string = 'Resource already exists') => createErrorResponse(message, 409),
	internalError: (message: string = 'Internal server error') => createErrorResponse(message, 500),
	rateLimitExceeded: (message: string = 'Rate limit exceeded') => createErrorResponse(message, 429)
};

/**
 * Common success responses
 */
export const successResponses = {
	ok: <T>(data: T) => createSuccessResponse(data, 200),
	created: <T>(data: T) => createSuccessResponse(data, 201),
	noContent: () => new Response(null, { status: 204 })
};

/**
 * Validation error response
 */
export const createValidationErrorResponse = (errors: string[]): Response => {
	return createErrorResponse(`Validation failed: ${errors.join(', ')}`, 400);
};