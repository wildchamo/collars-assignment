import { IRequest } from 'itty-router';
import { ApiResponse } from '../shared/types';
import { requireBody } from './require-body.middleware';

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
        (request as any).parsedBody = body;
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
