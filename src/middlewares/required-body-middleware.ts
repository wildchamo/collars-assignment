import { IRequest } from 'itty-router';
import { ApiResponse } from '../shared/types';

/**
 * Middleware to validate if request has body
 */
export const requireBody = (request: IRequest): Response | void => {
	// Check if request has body
	if (!request.body) {
		const response: ApiResponse = {
			success: false,
			error: 'Request body is required'
		};
		return new Response(JSON.stringify(response), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}
	// If body exists, continue to next handler
};

/**
 * Middleware to validate JSON body and parse it
 */
export const requireJSON = async (request: IRequest): Promise<Response | void> => {
	// First check if body exists
	const bodyCheck = requireBody(request);
	if (bodyCheck) return bodyCheck;

	try {
		// Try to parse JSON
		const body = await request.json();
		// Attach parsed body to request for next handlers
		request.parsedBody = body;
	} catch (parseError) {
		const response: ApiResponse = {
			success: false,
			error: 'Invalid JSON format'
		};
		return new Response(JSON.stringify(response), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}
	// If parsing successful, continue to next handler
};

/**
 * Middleware to validate specific fields in request body
 */
export const requireFields = (fields: string[]) => {
	return (request: IRequest): Response | void => {
		// Check if parsed body exists (should be set by requireJSON middleware)
		if (!request.parsedBody) {
			const response: ApiResponse = {
				success: false,
				error: 'Request body not parsed'
			};
			return new Response(JSON.stringify(response), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// Check if all required fields are present
		const missingFields = fields.filter(field => !request.parsedBody[field]);

		if (missingFields.length > 0) {
			const response: ApiResponse = {
				success: false,
				error: `Missing required fields: ${missingFields.join(', ')}`
			};
			return new Response(JSON.stringify(response), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			});
		}
		// If all fields present, continue to next handler
	};
};
