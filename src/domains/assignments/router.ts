import { Router } from 'itty-router';
import {
	assignTaskHandler,
	getUserTasksHandler,
} from './handlers';
import { requireAuth, requireJSON, requireFields, rateLimit } from '../../middlewares';
import { errorResponses } from '../../shared/response.utils';

const assignmentsRouter = Router();

// POST /tasks/:id/assign - Assign a task to a user
assignmentsRouter.post('/tasks/:id/assign', requireAuth, requireJSON,
	requireFields(['userId']), rateLimit, assignTaskHandler);

// GET /users/:id/tasks - Get all tasks assigned to a specific user (with optional filters)
assignmentsRouter.get('/users/:id/tasks', requireAuth, rateLimit, getUserTasksHandler);

assignmentsRouter.all('*', (request, env, ctx) => {
	return errorResponses.notFound('Route not found');
});
export { assignmentsRouter };
