import { Router } from 'itty-router';
import { AssignmentHandlers } from './handlers';

const assignmentsRouter = Router();

// POST /tasks/:id/assign - Assign a task to a user
assignmentsRouter.post('/tasks/:id/assign', AssignmentHandlers.assignTask);

// GET /users/:id/tasks - Get all tasks assigned to a specific user
assignmentsRouter.get('/users/:id/tasks', AssignmentHandlers.getUserTasks);

export { assignmentsRouter };
