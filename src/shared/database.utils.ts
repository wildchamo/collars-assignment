/**
 * User database operations
 */
export const userQueries = {
	/**
	 * Find user by email
	 */
	findByEmail: async (db: D1Database, email: string) => {
		return await db.prepare(
			'SELECT id, name, email, role, password FROM users WHERE email = ?'
		).bind(email).first();
	},

	/**
	 * Find user by ID
	 */
	findById: async (db: D1Database, id: string) => {
		return await db.prepare(
			'SELECT * FROM users WHERE id = ?'
		).bind(id).first();
	},

	/**
	 * Create new user
	 */
	create: async (db: D1Database, userData: {
		name: string;
		email: string;
		phoneNumber: string;
		password: string;
		role?: 'admin' | 'user';
	}) => {
		const { name, email, phoneNumber, password, role = 'user' } = userData;

		return await db.prepare(
			'INSERT INTO users (name, email, phone_number, password, role) VALUES (?, ?, ?, ?, ?)'
		).bind(name, email, phoneNumber, password, role).run();
	},

	/**
	 * Update user
	 */
	update: async (db: D1Database, id: string, userData: Partial<{
		name: string;
		email: string;
		phoneNumber: string;
		password: string;
	}>) => {
		const updateFields = [];
		const values = [];

		if (userData.name) {
			updateFields.push('name = ?');
			values.push(userData.name);
		}
		if (userData.email) {
			updateFields.push('email = ?');
			values.push(userData.email);
		}
		if (userData.phoneNumber) {
			updateFields.push('phone_number = ?');
			values.push(userData.phoneNumber);
		}
		if (userData.password) {
			updateFields.push('password = ?');
			values.push(userData.password);
		}

		if (updateFields.length === 0) {
			throw new Error('No fields to update');
		}

		values.push(id);

		return await db.prepare(
			`UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`
		).bind(...values).run();
	}
};

/**
 * Generic database helpers
 */
export const dbHelpers = {
	/**
	 * Check if record exists
	 */
	recordExists: async (db: D1Database, table: string, field: string, value: any): Promise<boolean> => {
		const result = await db.prepare(
			`SELECT 1 FROM ${table} WHERE ${field} = ? LIMIT 1`
		).bind(value).first();

		return result !== null;
	},

	/**
	 * Get record count
	 */
	getCount: async (db: D1Database, table: string, whereClause?: string, values?: any[]): Promise<number> => {
		let query = `SELECT COUNT(*) as count FROM ${table}`;

		if (whereClause) {
			query += ` WHERE ${whereClause}`;
		}

		const result = await db.prepare(query).bind(...(values || [])).first();
		return (result as any)?.count || 0;
	}
};
