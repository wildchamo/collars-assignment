import { Router } from 'itty-router';
import { UserHandlers } from './handlers';
import { requireAdmin } from '../../middlewares';

const usersRouter = Router({ base: '/users' });

// GET /users - Retrieve all users
usersRouter.get('/', UserHandlers.getAllUsers);

// GET /users/:id - Retrieve a specific user by ID
usersRouter.get('/:id', UserHandlers.getUserById);

// POST /users - Create a new user
usersRouter.post('/', requireAdmin, UserHandlers.createUser);

export { usersRouter };
