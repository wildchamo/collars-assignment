import { Router } from 'itty-router';
import { getAllUsersHandler, getUserByIdHandler, createUserHandler } from './handlers';
import { requireAdmin, requireFields, requireJSON, requireAuth } from '../../middlewares';
import { errorResponses } from '../../shared/response.utils';

const usersRouter = Router({ base: '/users' });

// GET /users - Retrieve all users
usersRouter.get('/', requireAuth, getAllUsersHandler);

// GET /users/:id - Retrieve a specific user by ID
usersRouter.get('/:id', requireAuth, getUserByIdHandler);

// POST /users - Create a new user
usersRouter.post('/', requireAdmin, requireJSON,
	requireFields(['name', 'email', 'password', "phoneNumber"]), createUserHandler);

usersRouter.all('*', () => errorResponses.notFound());


export { usersRouter };
