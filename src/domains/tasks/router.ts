import { Router } from 'itty-router';
import { TaskHandlers } from './handlers';

const tasksRouter = Router({ base: '/tasks' });

// GET /tasks - Retrieve all tasks with pagination and filtering options
tasksRouter.get('/', TaskHandlers.getAllTasks);

// GET /tasks/:id - Retrieve a specific task by ID
tasksRouter.get('/:id', TaskHandlers.getTaskById);

// POST /tasks - Create a new task
tasksRouter.post('/', TaskHandlers.createTask);

// PUT /tasks/:id - Update an existing task
tasksRouter.put('/:id', TaskHandlers.updateTask);

// DELETE /tasks/:id - Delete a task
tasksRouter.delete('/:id', TaskHandlers.deleteTask);

export { tasksRouter };
