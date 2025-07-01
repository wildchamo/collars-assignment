import { IRequest } from 'itty-router';
import { ApiResponse, AuthResponse, LoginRequest, AuthUser } from '../../shared/types';

import jwt from "@tsndr/cloudflare-worker-jwt"


export class AuthHandlers {
	static async login(request: IRequest): Promise<Response> {
		try {
			const body: LoginRequest = await request.json();
			const env = request.env as Env;

			// Validate request body
			if (!body.email || !body.password) {
				const response: ApiResponse = {
					success: false,
					error: 'Email and password are required'
				};
				return new Response(JSON.stringify(response), {
					status: 400,
					headers: { 'Content-Type': 'application/json' }
				});
			}

			// Query user from database
			const userQuery = await env.DB.prepare(
				'SELECT id, name, email, role, password FROM users WHERE email = ?'
			).bind(body.email).first();

			if (!userQuery) {
				const response: ApiResponse = {
					success: false,
					error: 'Invalid credentials'
				};
				return new Response(JSON.stringify(response), {
					status: 401,
					headers: { 'Content-Type': 'application/json' }
				});
			}

			// Simple password check (in production, use proper hashing)
			if (userQuery.password !== body.password) {
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

			// Generate simple token (in production, use JWT)
			const token = btoa(JSON.stringify({
				userId: authUser.id,
				email: authUser.email,
				role: authUser.role,
				timestamp: Date.now()
			}));

			const response: ApiResponse<AuthResponse> = {
				success: true,
				data: {
					user: authUser,
					token: token
				}
			};

			return new Response(JSON.stringify(response), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			});

		} catch (error) {
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
