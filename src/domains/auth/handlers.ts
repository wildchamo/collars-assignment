import { IRequest } from 'itty-router';
import { ApiResponse, AuthResponse, LoginRequest, AuthUser } from '../../shared/types';

import jwt from "@tsndr/cloudflare-worker-jwt"


export class AuthHandlers {
	static async login(request: IRequest): Promise<Response> {
		try {
			// Get parsed body from middleware
			const { email, password } = (request as any).parsedBody as LoginRequest;
			const { JWT_TOKEN, DB } = request.env as Env;

			// Query user from database
			const userQuery = await DB.prepare(
				'SELECT id, name, email, role, password FROM users WHERE email = ?'
			).bind(email).first();

			if (!userQuery) {
				const response: ApiResponse = {
					success: false,
					error: 'This email is not registered'
				};
				return new Response(JSON.stringify(response), {
					status: 401,
					headers: { 'Content-Type': 'application/json' }
				});
			}

			// Simple password check (in production, use proper hashing)
			if (userQuery.password !== password) {
				const response: ApiResponse = {
					success: false,
					error: 'Invalid credentials'
				};
				return new Response(JSON.stringify(response), {
					status: 401,
					headers: { 'Content-Type': 'application/json' }
				});
			}

			// Create auth user object
			const authUser: AuthUser = {
				id: userQuery.id as string,
				name: userQuery.name as string,
				email: userQuery.email as string,
				role: userQuery.role as 'admin' | 'user'
			};

			// Generate JWT token
			const token = await jwt.sign({
				userId: authUser.id,
				email: authUser.email,
				role: authUser.role,
				timestamp: Date.now()
			}, JWT_TOKEN);

			const response: ApiResponse<AuthResponse> = {
				success: true,
				data: {
					token: token
				}
			};

			return new Response(JSON.stringify(response), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			});

		} catch (error) {
			console.error('Login error:', error);
			const response: ApiResponse = {
				success: false,
				error: 'Internal server error'
			};
			return new Response(JSON.stringify(response), {
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			});
		}
	}

	static async logout(request: IRequest): Promise<Response> {
		try {
			// In a real implementation, you would:
			// 1. Extract token from Authorization header
			// 2. Add token to a blacklist/invalidate it
			// 3. Clear any server-side sessions

			// For now, just return success
			const response: ApiResponse = {
				success: true,
				data: { message: 'Logged out successfully' }
			};

			return new Response(JSON.stringify(response), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			});

		} catch (error) {
			console.error('Logout error:', error);
			const response: ApiResponse = {
				success: false,
				error: 'Internal server error'
			};
			return new Response(JSON.stringify(response), {
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			});
		}
	}
}
