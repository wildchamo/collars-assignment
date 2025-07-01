import { Router } from 'itty-router';
import { loginHandler, logoutHandler } from './handlers';
import { requireJSON, requireFields, requireAuth } from '../../middlewares';

const authRouter = Router({ base: '/auth' });

// POST /auth/login - Authenticate user and get token
authRouter.post('/login',
	requireJSON,
	requireFields(['email', 'password']),
	loginHandler
);

// POST /auth/logout - Logout user (invalidate token)
authRouter.post('/logout',
	requireAuth,
	logoutHandler
);

export { authRouter };
