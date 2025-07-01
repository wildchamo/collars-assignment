import { Router } from 'itty-router';
import { AuthHandlers } from './handlers';

const authRouter = Router({ base: '/auth' });

// POST /auth/login - Authenticate user and get token
authRouter.post('/login', AuthHandlers.login);

// POST /auth/logout - Logout user (invalidate token)
authRouter.post('/logout', AuthHandlers.logout);


export { authRouter };
