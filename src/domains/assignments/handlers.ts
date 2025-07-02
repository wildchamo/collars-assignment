import { IRequest } from 'itty-router';
import { errorResponses, successResponses } from '../../shared/response.utils';

/**
 * Assign task to user handler
 */
export const assignTaskHandler = async (request: IRequest, env: Env, ctx: ExecutionContext): Promise<Response> => {
	try {
		const { id } = request.params; // Task ID
		const { userId } = (request as any).parsedBody;
		const { DB } = env as Env;

		// Get current user from auth middleware
		const currentUser = (request as any).user;
		if (!currentUser) {
			return errorResponses.unauthorized('User authentication required');
		}

		// Validate required fields
		if (!id) {
			return errorResponses.badRequest('Task ID is required');
		}

		if (!userId) {
			return errorResponses.badRequest('User ID is required');
		}

		// Check if task exists
		const task = await DB.prepare('SELECT * FROM tasks WHERE id = ?').bind(id).first();
		if (!task) {
			return errorResponses.notFound('Task not found');
		}

		// Check if user exists
		const user = await DB.prepare('SELECT id, name, email FROM users WHERE id = ?').bind(userId).first();
		if (!user) {
			return errorResponses.badRequest('User not found');
		}

		// Update task assignment
		const result = await DB.prepare(
			'UPDATE tasks SET assigned_to = ?, updated_at = datetime("now") WHERE id = ?'
		).bind(userId, id).run();

		if (!result.success) {
			return errorResponses.internalError('Failed to assign task');
		}

		// Get updated task with user info
		const updatedTask = await DB.prepare(`
			SELECT
				t.*,
				u.name as assigned_user_name,
				u.email as assigned_user_email
			FROM tasks t
			LEFT JOIN users u ON t.assigned_to = u.id
			WHERE t.id = ?
		`).bind(id).first();

		return successResponses.ok({
			taskId: id,
			userId: userId,
			assignedAt: new Date().toISOString(),
			task: updatedTask,
			message: `Task successfully assigned to ${user.name}`
		});

	} catch (error) {
		console.error('Assign task error:', error);
		return errorResponses.internalError();
	}
};


/**
 * Get user's assigned tasks handler
 */
export const getUserTasksHandler = async (request: IRequest, env: Env, ctx: ExecutionContext): Promise<Response> => {
	try {
		const { id } = request.params; // User ID
		const { DB } = env as Env;

		// Get current user from auth middleware
		const currentUser = (request as any).user;
		if (!currentUser) {
			return errorResponses.unauthorized('User authentication required');
		}

		if (!id) {
			return errorResponses.badRequest('User ID is required');
		}

		// Extract query parameters for filtering
		const url = new URL(request.url);
		const searchParams = url.searchParams;
		const status = searchParams.get('status');
		const priority = searchParams.get('priority');

		// Validate filter values
		const validStatuses = ['pending', 'in_progress', 'completed'];
		if (status && !validStatuses.includes(status)) {
			return errorResponses.badRequest('Invalid status filter');
		}

		const validPriorities = ['low', 'medium', 'high'];
		if (priority && !validPriorities.includes(priority)) {
			return errorResponses.badRequest('Invalid priority filter');
		}

		// Check if user exists
		const user = await DB.prepare('SELECT id, name, email FROM users WHERE id = ?').bind(id).first();
		if (!user) {
			return errorResponses.notFound('User not found');
		}

		// Build query with filters
		let query = `
			SELECT
				t.*,
				creator.name as created_by_name,
				creator.email as created_by_email
			FROM tasks t
			LEFT JOIN users creator ON t.created_by = creator.id
			WHERE t.assigned_to = ?
		`;

		const queryParams = [id];

		if (status) {
			query += ' AND t.status = ?';
			queryParams.push(status);
		}

		if (priority) {
			query += ' AND t.priority = ?';
			queryParams.push(priority);
		}

		query += ' ORDER BY t.due_date ASC, t.priority DESC';

		// Execute query
		const tasksResult = await DB.prepare(query).bind(...queryParams).all();
		const tasks = tasksResult.results;

		// Get task statistics
		const statsQuery = `
			SELECT
				COUNT(*) as total,
				SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
				SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
				SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
			FROM tasks
			WHERE assigned_to = ?
		`;

		const stats = await DB.prepare(statsQuery).bind(id).first();

		return successResponses.ok({
			user: {
				id: user.id,
				name: user.name,
				email: user.email
			},
			tasks: tasks,
			statistics: stats,
			filters: {
				status: status || null,
				priority: priority || null
			},
			totalTasks: tasks.length
		});

	} catch (error) {
		console.error('Get user tasks error:', error);
		return errorResponses.internalError();
	}
};

