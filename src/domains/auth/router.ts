import { Router, RequestHandler } from 'itty-router';
import { loginHandler, logoutHandler } from './handlers';
import { requireJSON, requireFields } from '../../middlewares';

const authRouter = Router({ base: '/auth' });

// POST /auth/login - Authenticate user and get token
authRouter.post('/login',
	requireJSON,
	requireFields(['email', 'password']),
	loginHandler
);

// POST /auth/logout - Logout user (invalidate token)
authRouter.post('/logout', logoutHandler);

export { authRouter };
