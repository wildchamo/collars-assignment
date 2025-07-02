import { Router } from 'itty-router';
import { TaskHandlers } from './handlers';
import { requireAuth } from '../../middlewares';

const tasksRouter = Router({ base: '/tasks' });

// GET /tasks - Retrieve all tasks with pagination and filtering options
tasksRouter.get('/', requireAuth, TaskHandlers.getAllTasks);

// GET /tasks/:id - Retrieve a specific task by ID
tasksRouter.get('/:id', requireAuth, TaskHandlers.getTaskById);

// POST /tasks - Create a new task
tasksRouter.post('/', requireAuth, TaskHandlers.createTask);

// PUT /tasks/:id - Update an existing task
tasksRouter.put('/:id', requireAuth, TaskHandlers.updateTask);

// DELETE /tasks/:id - Delete a task
tasksRouter.delete('/:id', requireAuth, TaskHandlers.deleteTask);

export { tasksRouter };
