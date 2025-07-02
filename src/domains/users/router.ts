import { Router } from 'itty-router';
import { getAllUsersHandler, getUserByIdHandler, createUserHandler } from './handlers';
import { requireAdmin, requireFields, requireJSON } from '../../middlewares';

const usersRouter = Router({ base: '/users' });

// GET /users - Retrieve all users
usersRouter.get('/', getAllUsersHandler);

// GET /users/:id - Retrieve a specific user by ID
usersRouter.get('/:id', getUserByIdHandler);

// POST /users - Create a new user
usersRouter.post('/', requireAdmin, requireJSON,
	requireFields(['name', 'email', 'password', "phoneNumber"]), createUserHandler);

export { usersRouter };
