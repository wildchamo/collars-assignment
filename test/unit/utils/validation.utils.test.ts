import { describe, it, expect } from 'vitest';
import { isValidEmail, isValidPassword } from '../../../src/shared/validation.utils';

describe('Validation Utils', () => {
	describe('isValidEmail', () => {
		it('should validate correct email formats', () => {
			const validEmails = [
				'test@example.com',
				'user.name@domain.co.uk',
				'user+tag@example.org',
				'user123@test-domain.com',
			];

			validEmails.forEach(email => {
				expect(isValidEmail(email)).toBe(true);
			});
		});

		it('should reject invalid email formats', () => {
			const invalidEmails = [
				'invalid-email',
				'@example.com',
				'user@',
				'user..name@example.com',
				'user@.com',
				'',
				'user@example.',
				'user name@example.com',
			];

			invalidEmails.forEach(email => {
				expect(isValidEmail(email)).toBe(false);
			});
		});
	});

	describe('isValidPassword', () => {
		it('should accept valid passwords', () => {
			const validPasswords = [
				'ValidPass123!',
				'Another@Valid1',
				'ComplexP@ssw0rd',
				'Test123#Pass',
			];

			validPasswords.forEach(password => {
				const result = isValidPassword(password);
				expect(result.isValid).toBe(true);
				expect(result.message).toBeUndefined();
			});
		});

		it('should reject passwords that are too short', () => {
			const shortPasswords = ['123', 'short', 'Test1!'];

			shortPasswords.forEach(password => {
				const result = isValidPassword(password);
				expect(result.isValid).toBe(false);
				expect(result.message).toContain('at least');
			});
		});

		it('should reject passwords without uppercase letters', () => {
			const noUppercase = ['validpass123!', 'another@valid1', 'nouppercasehere123!'];

			noUppercase.forEach(password => {
				const result = isValidPassword(password);
				expect(result.isValid).toBe(false);
				expect(result.message).toContain('uppercase');
			});
		});

		it('should reject passwords without lowercase letters', () => {
			const noLowercase = ['VALIDPASS123!', 'ANOTHER@VALID1', 'NOLOWERCASEHERE123!'];

			noLowercase.forEach(password => {
				const result = isValidPassword(password);
				expect(result.isValid).toBe(false);
				expect(result.message).toContain('lowercase');
			});
		});

		it('should reject passwords without numbers', () => {
			const noNumbers = ['ValidPass!', 'Another@Valid', 'NoNumbersHere!'];

			noNumbers.forEach(password => {
				const result = isValidPassword(password);
				expect(result.isValid).toBe(false);
				expect(result.message).toContain('number');
			});
		});

		it('should reject passwords without special characters', () => {
			const noSpecial = ['ValidPass123', 'AnotherValid1', 'NoSpecialChars123'];

			noSpecial.forEach(password => {
				const result = isValidPassword(password);
				expect(result.isValid).toBe(false);
				expect(result.message).toContain('special character');
			});
		});

		it('should handle empty password', () => {
			const result = isValidPassword('');
			expect(result.isValid).toBe(false);
			expect(result.message).toBeDefined();
		});
	});
});
