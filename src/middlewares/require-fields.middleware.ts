import { IRequest } from 'itty-router';
import { ApiResponse } from '../shared/types';

/**
 * Middleware to validate specific fields in request body
 */
export const requireFields = (fields: string[]) => {
    return (request: IRequest): Response | void => {
        // Check if parsed body exists (should be set by requireJSON middleware)
        const parsedBody = (request as any).parsedBody;
        if (!parsedBody) {
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
        const missingFields = fields.filter(field => !parsedBody[field]);

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
