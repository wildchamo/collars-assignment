import jwt from "@tsndr/cloudflare-worker-jwt";
import { AuthUser, JWTPayload } from './types';

/**
 * Generate JWT token for authenticated user
 */
export const generateJWT = async (user: AuthUser, jwtSecret: string): Promise<string> => {
	const payload: JWTPayload = {
		userId: user.id,
		email: user.email,
		role: user.role,
		iat: Math.floor(Date.now() / 1000), // Issued at
		exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // Expires in 24 hours
	};

	return await jwt.sign(payload, jwtSecret);
};

/**
 * Verify JWT token and extract payload
 */
export const verifyJWT = async (token: string, jwtSecret: string): Promise<JWTPayload | null> => {
	try {
		const isValid = await jwt.verify(token, jwtSecret);
		if (!isValid) return null;

		const payload = jwt.decode(token);
		return payload.payload as JWTPayload;
	} catch (error) {
		console.error('JWT verification error:', error);
		return null;
	}
};

/**
 * Extract token from Authorization header
 */
export const extractTokenFromHeader = (authHeader: string | null): string | null => {
	if (!authHeader) return null;

	// Expected format: "Bearer <token>"
	const parts = authHeader.split(' ');
	if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

	return parts[1];
};
