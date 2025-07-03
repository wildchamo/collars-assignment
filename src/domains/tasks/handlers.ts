import { IRequest } from 'itty-router';
import { errorResponses, successResponses } from '../../shared/response.utils';

/**
 * Get all tasks handler with pagination and filtering
 */
export const getAllTasksHandler = async (request: IRequest, env: Env, ctx: ExecutionContext): Promise<Response> => {
	try {
		const { DB } = env as Env;

		// Extract query parameters
		const url = new URL(request.url);
		const searchParams = url.searchParams;

		// Pagination parameters
		const page = parseInt(searchParams.get('page') || '1');
		const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20); // Max 20 items per page
		const offset = (page - 1) * limit;

		// Validate pagination parameters
		if (page < 1) {
			return errorResponses.badRequest('Page must be greater than 0');
		}
		if (limit < 1) {
			return errorResponses.badRequest('Limit must be greater than 0');
		}

		// Filter parameters
		const status = searchParams.get('status');
		const priority = searchParams.get('priority');
		const assignedTo = searchParams.get('assignedTo');
		const createdBy = searchParams.get('createdBy');

		// Sorting parameters
		const sortBy = searchParams.get('sortBy') || 'created_at';
		const sortOrder = searchParams.get('sortOrder')?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

		// Validate filter values
		const validStatuses = ['pending', 'in_progress', 'completed'];
		if (status && !validStatuses.includes(status)) {
			return errorResponses.badRequest('Invalid status filter. Must be: pending, in_progress, or completed');
		}

		const validPriorities = ['low', 'medium', 'high'];
		if (priority && !validPriorities.includes(priority)) {
			return errorResponses.badRequest('Invalid priority filter. Must be: low, medium, or high');
		}

		const validSortFields = ['title', 'status', 'priority', 'due_date', 'created_at', 'updated_at'];
		if (!validSortFields.includes(sortBy)) {
			return errorResponses.badRequest('Invalid sortBy field. Must be: title, status, priority, due_date, created_at, or updated_at');
		}

		// Build WHERE clause dynamically
		const whereConditions: string[] = [];
		const whereParams: any[] = [];

		if (status) {
			whereConditions.push('status = ?');
			whereParams.push(status);
		}

		if (priority) {
			whereConditions.push('priority = ?');
			whereParams.push(priority);
		}

		if (assignedTo) {
			whereConditions.push('assigned_to = ?');
			whereParams.push(assignedTo);
		}

		if (createdBy) {
			whereConditions.push('created_by = ?');
			whereParams.push(createdBy);
		}

		// Build the complete WHERE clause
		const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

		// Build the main query
		const mainQuery = `
			SELECT
				id, title, description, status, priority, due_date,
				assigned_to, created_by, created_at, updated_at
			FROM tasks
			${whereClause}
			ORDER BY ${sortBy} ${sortOrder}
			LIMIT ? OFFSET ?
		`;

		// Build the count query for pagination metadata
		const countQuery = `
			SELECT COUNT(*) as total
			FROM tasks
			${whereClause}
		`;

		// Execute both queries
		const [tasksResult, countResult] = await Promise.all([
			DB.prepare(mainQuery).bind(...whereParams, limit, offset).all(),
			DB.prepare(countQuery).bind(...whereParams).first()
		]);

		const tasks = tasksResult.results;
		const total = (countResult as any)?.total || 0;

		// If no tasks found, return empty array
		if (total === 0) {
			return successResponses.ok([]);
		}

		// Calculate pagination metadata
		const totalPages = Math.ceil(total / limit);
		const hasNextPage = page < totalPages;
		const hasPrevPage = page > 1;

		// Return paginated response with metadata
		return successResponses.ok({
			data: tasks,
			pagination: {
				page,
				limit,
				total,
				totalPages,
				hasNextPage,
				hasPrevPage
			},
			filters: {
				status: status || null,
				priority: priority || null,
				assignedTo: assignedTo || null,
				createdBy: createdBy || null
			},
			sorting: {
				sortBy,
				sortOrder
			}
		});

	} catch (error) {
		console.error('Get all tasks error:', error);
		return errorResponses.internalError();
	}
};

/**
 * Get task by ID handler
 */
export const getTaskByIdHandler = async (request: IRequest, env: Env, ctx: ExecutionContext): Promise<Response> => {
	try {
		const { id } = request.params;
		const { DB } = env as Env;

		if (!id) {
			return errorResponses.badRequest('Task ID is required');
		}

		const task = await DB.prepare('SELECT * FROM tasks WHERE id = ?').bind(id).first();

		if (!task) {
			return errorResponses.notFound('Task not found');
		}

		return successResponses.ok(task);
	} catch (error) {
		console.error('Get task by ID error:', error);
		return errorResponses.internalError();
	}
};

/**
 * Create task handler
 */
export const createTaskHandler = async (request: IRequest, env: Env, ctx: ExecutionContext): Promise<Response> => {
	try {
		// Extract fields from parsed body (title, description, dueDate already validated by middleware)
		const { title, description, dueDate, status, priority, assignedTo } = (request as any).parsedBody;
		const { DB } = env as Env;

		// Get current user from auth middleware
		const currentUser = (request as any).user;
		if (!currentUser) {
			return errorResponses.unauthorized('User authentication required');
		}

		// Validate optional status field
		const validStatuses = ['pending', 'in_progress', 'completed'];
		if (status && !validStatuses.includes(status)) {
			return errorResponses.badRequest('Invalid status. Must be: pending, in_progress, or completed');
		}

		// Validate optional priority field
		const validPriorities = ['low', 'medium', 'high'];
		if (priority && !validPriorities.includes(priority)) {
			return errorResponses.badRequest('Invalid priority. Must be: low, medium, or high');
		}

		// Validate dueDate format (should be ISO string or timestamp)
		let parsedDueDate: Date;
		try {
			parsedDueDate = new Date(dueDate);
			if (isNaN(parsedDueDate.getTime())) {
				return errorResponses.badRequest('Invalid dueDate format. Must be a valid timestamp');
			}
		} catch (error) {
			return errorResponses.badRequest('Invalid dueDate format. Must be a valid timestamp');
		}

		// Validate assignedTo user exists if provided
		if (assignedTo) {
			const assignedUser = await DB.prepare('SELECT id FROM users WHERE id = ?').bind(assignedTo).first();
			if (!assignedUser) {
				return errorResponses.badRequest('Assigned user not found');
			}
		}

		// Insert task into database
		const result = await DB.prepare(`
			INSERT INTO tasks (
				title, description, status, priority, due_date, assigned_to, created_by, created_at, updated_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, datetime("now"), datetime("now"))
		`).bind(
			title,
			description,
			status || 'pending', // Default status
			priority || 'medium', // Default priority
			parsedDueDate.toISOString(),
			assignedTo || null, // Nullable
			currentUser.id, // created_by from authenticated user
		).run();

		if (!result.success) {
			return errorResponses.internalError('Failed to create task');
		}

		// Return success response with created task
		return successResponses.created({
			id: result.meta?.last_row_id,
			title,
			description,
			status: status || 'pending',
			priority: priority || 'medium',
			dueDate: parsedDueDate.toISOString(),
			assignedTo: assignedTo || null,
			createdBy: currentUser.id,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		});

	} catch (error) {
		console.error('Create task error:', error);
		return errorResponses.internalError();
	}
};

/**
 * Update task handler
 */
export const updateTaskHandler = async (request: IRequest, env: Env, ctx: ExecutionContext): Promise<Response> => {
	try {
		const { id } = request.params;
		// Extract fields from parsed body (all fields are optional for updates)
		const { title, description, status, priority, dueDate, assignedTo } = (request as any).parsedBody;
		const { DB } = env as Env;

		if (!id) {
			return errorResponses.badRequest('Task ID is required');
		}

		// Check if task exists
		const existingTask = await DB.prepare('SELECT * FROM tasks WHERE id = ?').bind(id).first();
		if (!existingTask) {
			return errorResponses.notFound('Task not found');
		}

		// Validate optional status field
		const validStatuses = ['pending', 'in_progress', 'completed'];
		if (status && !validStatuses.includes(status)) {
			return errorResponses.badRequest('Invalid status. Must be: pending, in_progress, or completed');
		}

		// Validate optional priority field
		const validPriorities = ['low', 'medium', 'high'];
		if (priority && !validPriorities.includes(priority)) {
			return errorResponses.badRequest('Invalid priority. Must be: low, medium, or high');
		}

		// Validate dueDate format if provided
		let parsedDueDate: string | null = null;
		if (dueDate !== undefined) {
			try {
				const dateObj = new Date(dueDate);
				if (isNaN(dateObj.getTime())) {
					return errorResponses.badRequest('Invalid dueDate format. Must be a valid timestamp');
				}
				parsedDueDate = dateObj.toISOString();
			} catch (error) {
				return errorResponses.badRequest('Invalid dueDate format. Must be a valid timestamp');
			}
		}

		// Validate assignedTo user exists if provided
		if (assignedTo !== undefined && assignedTo !== null) {
			const assignedUser = await DB.prepare('SELECT id FROM users WHERE id = ?').bind(assignedTo).first();
			if (!assignedUser) {
				return errorResponses.badRequest('Assigned user not found');
			}
		}

		// Update task in database (only update provided fields)
		const result = await DB.prepare(`
			UPDATE tasks SET
				title = COALESCE(?, title),
				description = COALESCE(?, description),
				status = COALESCE(?, status),
				priority = COALESCE(?, priority),
				due_date = COALESCE(?, due_date),
				assigned_to = CASE WHEN ? IS NOT NULL THEN ? ELSE assigned_to END,
				updated_at = datetime("now")
			WHERE id = ?
		`).bind(
			title || null,
			description || null,
			status || null,
			priority || null,
			parsedDueDate,
			assignedTo !== undefined ? assignedTo : null,
			assignedTo !== undefined ? assignedTo : null,
			id
		).run();

		if (!result.success) {
			return errorResponses.internalError('Failed to update task');
		}

		// Get updated task
		const updatedTask = await DB.prepare('SELECT * FROM tasks WHERE id = ?').bind(id).first();

		return successResponses.ok(updatedTask);

	} catch (error) {
		console.error('Update task error:', error);
		return errorResponses.internalError();
	}
};

/**
 * Delete task handler
 */
export const deleteTaskHandler = async (request: IRequest, env: Env, ctx: ExecutionContext): Promise<Response> => {
	try {
		const { id } = request.params;
		const { DB } = env as Env;

		if (!id) {
			return errorResponses.badRequest('Task ID is required');
		}

		// Check if task exists
		const existingTask = await DB.prepare('SELECT * FROM tasks WHERE id = ?').bind(id).first();
		if (!existingTask) {
			return errorResponses.notFound('Task not found');
		}

		// Delete task from database
		const result = await DB.prepare('DELETE FROM tasks WHERE id = ?').bind(id).run();

		if (!result.success) {
			return errorResponses.internalError('Failed to delete task');
		}

		return successResponses.ok({ message: 'Task deleted successfully' });

	} catch (error) {
		console.error('Delete task error:', error);
		return errorResponses.internalError();
	}
};
