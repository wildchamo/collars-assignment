import { Router } from 'itty-router';
import { loginHandler, logoutHandler } from './handlers';
import { requireJSON, requireFields, requireAuth, rateLimit } from '../../middlewares';
import { errorResponses } from '../../shared/response.utils';

const authRouter = Router({ base: '/auth' });

// POST /auth/login - Authenticate user and get token
authRouter.post('/login',
	rateLimit,
	requireJSON,
	requireFields(['email', 'password']),
	loginHandler
);

// POST /auth/logout - Logout user (invalidate token)
authRouter.post('/logout',
	requireAuth,
	rateLimit,
	logoutHandler
);

authRouter.all('*', () => errorResponses.notFound());

export { authRouter };
