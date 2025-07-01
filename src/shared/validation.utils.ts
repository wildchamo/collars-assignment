/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const isValidPassword = (password: string): { isValid: boolean; message?: string } => {
	if (!password) {
		return { isValid: false, message: 'Password is required' };
	}

	if (password.length < 4) {
		return { isValid: false, message: 'Password must be at least 6 characters long' };
	}

	return { isValid: true };
};

/**
 * Validate phone number format
 */
export const isValidPhoneNumber = (phone: string): boolean => {
	// Simple phone validation - can be enhanced
	const phoneRegex = /^\+?[\d\s\-\(\)]{7,15}$/;
	return phoneRegex.test(phone);
};

/**
 * Sanitize string input
 */
export const sanitizeString = (input: string): string => {
	return input.trim().replace(/[<>]/g, '');
};

/**
 * Validate required fields in object
 */
export const validateRequiredFields = (obj: any, requiredFields: string[]): { isValid: boolean; missingFields?: string[] } => {
	const missingFields = requiredFields.filter(field => !obj[field]);

	return {
		isValid: missingFields.length === 0,
		missingFields: missingFields.length > 0 ? missingFields : undefined
	};
};
