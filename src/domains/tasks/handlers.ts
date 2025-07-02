import { IRequest } from 'itty-router';
import { Task } from '../../shared/types';
import { errorResponses, successResponses } from '../../shared/response.utils';

/**
 * Get all tasks handler
 */
export const getAllTasksHandler = async (request: IRequest, env: Env, ctx: ExecutionContext): Promise<Response> => {
	try {
		const { DB } = env as Env;

		// TODO: Implement pagination and filtering logic
		const response = await DB.prepare('SELECT * FROM tasks').all();
		const tasks = response.results;

		return successResponses.ok(tasks);
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
		const { title, description, status, assignedUserId } = (request as any).parsedBody;
		const { DB } = env as Env;

		// Validate required fields
		if (!title) {
			return errorResponses.badRequest('Title is required');
		}

		// Validate status if provided
		const validStatuses = ['pending', 'in-progress', 'completed'];
		if (status && !validStatuses.includes(status)) {
			return errorResponses.badRequest('Invalid status. Must be: pending, in-progress, or completed');
		}

		// Insert task into database
		const result = await DB.prepare(
			'INSERT INTO tasks (title, description, status, assignedUserId, createdAt, updatedAt) VALUES (?, ?, ?, ?, datetime("now"), datetime("now"))'
		).bind(
			title,
			description || null,
			status || 'pending',
			assignedUserId || null
		).run();

		if (!result.success) {
			return errorResponses.internalError('Failed to create task');
		}

		// Return success response
		return successResponses.created({
			id: result.meta?.last_row_id,
			title,
			description: description || null,
			status: status || 'pending',
			assignedUserId: assignedUserId || null,
			createdAt: new Date(),
			updatedAt: new Date()
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
		const { title, description, status, assignedUserId } = (request as any).parsedBody;
		const { DB } = env as Env;

		if (!id) {
			return errorResponses.badRequest('Task ID is required');
		}

		// Check if task exists
		const existingTask = await DB.prepare('SELECT * FROM tasks WHERE id = ?').bind(id).first();
		if (!existingTask) {
			return errorResponses.notFound('Task not found');
		}

		// Validate status if provided
		const validStatuses = ['pending', 'in-progress', 'completed'];
		if (status && !validStatuses.includes(status)) {
			return errorResponses.badRequest('Invalid status. Must be: pending, in-progress, or completed');
		}

		// Update task in database
		const result = await DB.prepare(
			'UPDATE tasks SET title = ?, description = ?, status = ?, assignedUserId = ?, updatedAt = datetime("now") WHERE id = ?'
		).bind(
			title || existingTask.title,
			description !== undefined ? description : existingTask.description,
			status || existingTask.status,
			assignedUserId !== undefined ? assignedUserId : existingTask.assignedUserId,
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
