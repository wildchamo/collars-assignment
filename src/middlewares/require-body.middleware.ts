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
