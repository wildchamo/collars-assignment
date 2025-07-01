import { IRequest } from 'itty-router';
import { ApiResponse, AuthResponse, LoginRequest, AuthUser } from '../../shared/types';

import jwt from "@tsndr/cloudflare-worker-jwt"


export class AuthHandlers {
	static async login(request: IRequest, env: Env): Promise<Response> {
		try {
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

			let requestBody: LoginRequest;

			try {
				requestBody = await request.json() as LoginRequest;
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



			const { email, password } = requestBody;
			const { JWT_TOKEN, DB } = env;


			console.log(JWT_TOKEN);

			// Validate request body
			if (!email || !password) {
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

			// Generate simple token (in production, use JWT)
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
