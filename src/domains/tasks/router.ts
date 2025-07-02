import { Router } from 'itty-router';
import {
	getAllTasksHandler,
	getTaskByIdHandler,
	createTaskHandler,
	updateTaskHandler,
	deleteTaskHandler
} from './handlers';
import { requireAuth, requireJSON, requireFields, rateLimit } from '../../middlewares';

const tasksRouter = Router({ base: '/tasks' });

// GET /tasks - Retrieve all tasks with pagination and filtering options
tasksRouter.get('/', requireAuth, rateLimit, getAllTasksHandler);

// GET /tasks/:id - Retrieve a specific task by ID
tasksRouter.get('/:id', requireAuth, rateLimit, getTaskByIdHandler);

// POST /tasks - Create a new task
tasksRouter.post('/', requireAuth, requireJSON,
	requireFields(['title', 'description', 'dueDate']), rateLimit, createTaskHandler);

// PUT /tasks/:id - Update an existing task
tasksRouter.put('/:id', requireAuth, requireJSON, rateLimit, updateTaskHandler);

// DELETE /tasks/:id - Delete a task
tasksRouter.delete('/:id', requireAuth, rateLimit, deleteTaskHandler);

export { tasksRouter };
