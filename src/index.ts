/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { Router } from 'itty-router';
import { tasksRouter } from './domains/tasks/router';
import { usersRouter } from './domains/users/router';
import { assignmentsRouter } from './domains/assignments/router';

// Main router that orchestrates all domain routers
const router = Router();

// Health check endpoint
router.get('/', () =>
	new Response(JSON.stringify({
		message: 'Task Management API',
		version: '1.0.0',
		endpoints: {
			tasks: '/tasks',
			users: '/users',
			assignments: '/tasks/:id/assign, /users/:id/tasks'
		}
	}), {
		headers: { 'Content-Type': 'application/json' }
	})
);

// Register domain routers
router.all('/tasks/*', tasksRouter.fetch);
router.all('/users/*', usersRouter.fetch);
router.all('/tasks/*/assign', assignmentsRouter.fetch);
router.all('/users/*/tasks', assignmentsRouter.fetch);

// Catch all for unmatched routes
router.all('*', () => new Response('Not found', { status: 404 }));

export default {
	async fetch(request, env: Env, ctx): Promise<Response> {
		return router.fetch(request, env, ctx);
	},
} satisfies ExportedHandler<Env>;
