import jwt from "@tsndr/cloudflare-worker-jwt";
import { AuthUser, JWTPayload } from './types';
import { createTokenPayloadWithVersion, isTokenVersionValid } from './token-versioning.utils';

/**
 * Generate JWT token for authenticated user with versioning
 */
export const generateJWT = async (user: AuthUser, jwtSecret: string, db: D1Database): Promise<string> => {
	const payload = await createTokenPayloadWithVersion(db, user);
	return await jwt.sign(payload, jwtSecret);
};

/**
 * Verify JWT token and validate version
 */
export const verifyJWT = async (token: string, jwtSecret: string, db: D1Database): Promise<JWTPayload | null> => {
	try {
		const isValid = await jwt.verify(token, jwtSecret);
		if (!isValid) return null;

		const decoded = jwt.decode(token);
		const payload = decoded.payload as JWTPayload;

		// Validate token version against user's current version
		const isVersionValid = await isTokenVersionValid(db, payload.userId, payload.tokenVersion);
		if (!isVersionValid) return null;

		return payload;
	} catch (error) {
		console.error('JWT verification error:', error);
		return null;
	}
};

/**
 * Legacy: Verify JWT token without version validation
 */
export const verifyJWTLegacy = async (token: string, jwtSecret: string): Promise<JWTPayload | null> => {
	try {
		const isValid = await jwt.verify(token, jwtSecret);
		if (!isValid) return null;

		const decoded = jwt.decode(token);
		return decoded.payload as JWTPayload;
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
