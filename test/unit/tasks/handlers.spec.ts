import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createExecutionContext } from 'cloudflare:test';
import {
	getAllTasksHandler,
	getTaskByIdHandler,
	createTaskHandler,
	updateTaskHandler,
	deleteTaskHandler
} from '../../../src/domains/tasks/handlers';

// Mock response utilities
vi.mock('../../../src/shared/response.utils', () => ({
	errorResponses: {
		badRequest: vi.fn((message: string) => new Response(JSON.stringify({ success: false, error: message }), { status: 400 })),
		unauthorized: vi.fn((message: string) => new Response(JSON.stringify({ success: false, error: message }), { status: 401 })),
		notFound: vi.fn((message: string) => new Response(JSON.stringify({ success: false, error: message }), { status: 404 })),
		internalError: vi.fn(() => new Response(JSON.stringify({ success: false, error: 'Internal server error' }), { status: 500 }))
	},
	successResponses: {
		ok: vi.fn((data: any) => new Response(JSON.stringify({ success: true, data }), { status: 200 })),
		created: vi.fn((data: any) => new Response(JSON.stringify({ success: true, data }), { status: 201 }))
	}
}));

describe('Tasks Handlers', () => {
	let mockEnv: Env;
	let mockCtx: ExecutionContext;

	beforeEach(() => {
		vi.clearAllMocks();

		mockCtx = createExecutionContext();

		mockEnv = {
			DB: {
				prepare: vi.fn().mockReturnThis(),
				bind: vi.fn().mockReturnThis(),
				all: vi.fn(),
				first: vi.fn(),
				run: vi.fn()
			}
		} as any;
	});

	describe('getAllTasksHandler', () => {
		it('should return paginated tasks successfully with default parameters', async () => {
			const mockTasks = [
				{
					id: '1',
					title: 'Task 1',
					description: 'Description 1',
					status: 'pending',
					priority: 'high',
					dueDate: '2024-12-31T23:59:59Z',
					assignedTo: 'user1',
					createdBy: 'admin1',
					createdAt: '2024-01-01T00:00:00Z',
					updatedAt: '2024-01-01T00:00:00Z'
				},
				{
					id: '2',
					title: 'Task 2',
					description: 'Description 2',
					status: 'in_progress',
					priority: 'medium',
					dueDate: '2024-12-15T10:00:00Z',
					assignedTo: 'user2',
					createdBy: 'admin1',
					createdAt: '2024-01-02T00:00:00Z',
					updatedAt: '2024-01-02T00:00:00Z'
				}
			];

			const mockCountResult = { total: 25 };

			vi.mocked(mockEnv.DB.prepare).mockImplementation((query: string) => ({
				bind: vi.fn().mockReturnThis(),
				all: vi.fn().mockResolvedValue({ results: mockTasks }),
				first: vi.fn().mockResolvedValue(mockCountResult)
			} as any));

			const mockRequest = {
				url: 'http://localhost:3000/tasks'
			} as any;

			const response = await getAllTasksHandler(mockRequest, mockEnv, mockCtx);
			const responseData = await response.json() as any;

			expect(response.status).toBe(200);
			expect(responseData.success).toBe(true);
			expect(responseData.data.data).toEqual(mockTasks);
			expect(responseData.data.pagination).toEqual({
				page: 1,
				limit: 10,
				total: 25,
				totalPages: 3,
				hasNextPage: true,
				hasPrevPage: false
			});
		});

		it('should return empty array when no tasks found', async () => {
			const mockTasks: any[] = [];
			const mockCountResult = { total: 0 };

			vi.mocked(mockEnv.DB.prepare).mockImplementation(() => ({
				bind: vi.fn().mockReturnThis(),
				all: vi.fn().mockResolvedValue({ results: mockTasks }),
				first: vi.fn().mockResolvedValue(mockCountResult)
			} as any));

			const mockRequest = {
				url: 'http://localhost:3000/tasks'
			} as any;

			const response = await getAllTasksHandler(mockRequest, mockEnv, mockCtx);
			const responseData = await response.json() as any;

			expect(response.status).toBe(200);
			expect(responseData.success).toBe(true);
			expect(responseData.data).toEqual([]);
		});

		it('should handle pagination parameters correctly when tasks exist', async () => {
			const mockTasks = [
				{ id: '1', title: 'Task 1', status: 'pending' }
			];
			const mockCountResult = { total: 10 };

			vi.mocked(mockEnv.DB.prepare).mockImplementation(() => ({
				bind: vi.fn().mockReturnThis(),
				all: vi.fn().mockResolvedValue({ results: mockTasks }),
				first: vi.fn().mockResolvedValue(mockCountResult)
			} as any));

			const mockRequest = {
				url: 'http://localhost:3000/tasks?page=2&limit=5'
			} as any;

			const response = await getAllTasksHandler(mockRequest, mockEnv, mockCtx);
			const responseData = await response.json() as any;

			expect(response.status).toBe(200);
			expect(responseData.success).toBe(true);
			expect(responseData.data.pagination.page).toBe(2);
			expect(responseData.data.pagination.limit).toBe(5);
			expect(responseData.data.pagination.total).toBe(10);
		});


		it('should return 400 for invalid status filter', async () => {
			const mockRequest = {
				url: 'http://localhost:3000/tasks?status=invalid_status'
			} as any;

			const response = await getAllTasksHandler(mockRequest, mockEnv, mockCtx);

			expect(response.status).toBe(400);
		});

		it('should return 400 for invalid priority filter', async () => {
			const mockRequest = {
				url: 'http://localhost:3000/tasks?priority=invalid_priority'
			} as any;

			const response = await getAllTasksHandler(mockRequest, mockEnv, mockCtx);

			expect(response.status).toBe(400);
		});

		it('should return 400 for invalid page parameter', async () => {
			const mockRequest = {
				url: 'http://localhost:3000/tasks?page=0'
			} as any;

			const response = await getAllTasksHandler(mockRequest, mockEnv, mockCtx);

			expect(response.status).toBe(400);
		});

		it('should handle database errors gracefully', async () => {
			vi.mocked(mockEnv.DB.prepare).mockImplementation(() => ({
				bind: vi.fn().mockReturnThis(),
				all: vi.fn().mockRejectedValue(new Error('Database connection failed')),
				first: vi.fn().mockRejectedValue(new Error('Database connection failed'))
			} as any));

			const mockRequest = {
				url: 'http://localhost:3000/tasks'
			} as any;

			const response = await getAllTasksHandler(mockRequest, mockEnv, mockCtx);

			expect(response.status).toBe(500);
		});
	});

	describe('getTaskByIdHandler', () => {
		it('should return task by ID successfully', async () => {
			const mockTask = {
				id: 'task123',
				title: 'Test Task',
				description: 'Test Description',
				status: 'pending',
				priority: 'high',
				dueDate: '2024-12-31T23:59:59Z',
				assignedTo: 'user1',
				createdBy: 'admin1',
				createdAt: '2024-01-01T00:00:00Z',
				updatedAt: '2024-01-01T00:00:00Z'
			};

			vi.mocked(mockEnv.DB.prepare).mockReturnValue({
				bind: vi.fn().mockReturnThis(),
				first: vi.fn().mockResolvedValue(mockTask)
			} as any);

			const mockRequest = {
				params: { id: 'task123' }
			} as any;

			const response = await getTaskByIdHandler(mockRequest, mockEnv, mockCtx);
			const responseData = await response.json() as any;

			expect(response.status).toBe(200);
			expect(responseData.success).toBe(true);
			expect(responseData.data).toEqual(mockTask);
		});

		it('should return 400 when task ID is missing', async () => {
			const mockRequest = {
				params: {}
			} as any;

			const response = await getTaskByIdHandler(mockRequest, mockEnv, mockCtx);

			expect(response.status).toBe(400);
		});

		it('should return 404 when task is not found', async () => {
			vi.mocked(mockEnv.DB.prepare).mockReturnValue({
				bind: vi.fn().mockReturnThis(),
				first: vi.fn().mockResolvedValue(null)
			} as any);

			const mockRequest = {
				params: { id: 'nonexistent' }
			} as any;

			const response = await getTaskByIdHandler(mockRequest, mockEnv, mockCtx);

			expect(response.status).toBe(404);
		});

		it('should handle database errors gracefully', async () => {
			vi.mocked(mockEnv.DB.prepare).mockReturnValue({
				bind: vi.fn().mockReturnThis(),
				first: vi.fn().mockRejectedValue(new Error('Database error'))
			} as any);

			const mockRequest = {
				params: { id: 'task123' }
			} as any;

			const response = await getTaskByIdHandler(mockRequest, mockEnv, mockCtx);

			expect(response.status).toBe(500);
		});
	});

	describe('createTaskHandler', () => {
		const mockUser = {
			id: 'user123',
			name: 'Test User',
			email: 'test@example.com',
			role: 'user'
		};

		it('should create task successfully', async () => {
			// Mock successful database operations
			vi.mocked(mockEnv.DB.prepare).mockImplementation((query: string) => {
				if (query.includes('SELECT id FROM users')) {
					return {
						bind: vi.fn().mockReturnThis(),
						first: vi.fn().mockResolvedValue({ id: 'assignedUser123' })
					} as any;
				}
				return {
					bind: vi.fn().mockReturnThis(),
					run: vi.fn().mockResolvedValue({
						success: true,
						meta: { last_row_id: 'new-task-123' }
					})
				} as any;
			});

			const mockRequest = {
				parsedBody: {
					title: 'New Task',
					description: 'Task description',
					dueDate: '2024-12-31T23:59:59Z',
					status: 'pending',
					priority: 'high',
					assignedTo: 'assignedUser123'
				},
				user: mockUser
			} as any;

			const response = await createTaskHandler(mockRequest, mockEnv, mockCtx);
			const responseData = await response.json() as any;

			expect(response.status).toBe(201);
			expect(responseData.success).toBe(true);
			expect(responseData.data.title).toBe('New Task');
			expect(responseData.data.status).toBe('pending');
			expect(responseData.data.priority).toBe('high');
		});

		it('should return 401 when user is not authenticated', async () => {
			const mockRequest = {
				parsedBody: {
					title: 'New Task',
					description: 'Task description',
					dueDate: '2024-12-31T23:59:59Z'
				}
				// no user property
			} as any;

			const response = await createTaskHandler(mockRequest, mockEnv, mockCtx);

			expect(response.status).toBe(401);
		});

		it('should return 400 for invalid status', async () => {
			const mockRequest = {
				parsedBody: {
					title: 'New Task',
					description: 'Task description',
					dueDate: '2024-12-31T23:59:59Z',
					status: 'invalid_status'
				},
				user: mockUser
			} as any;

			const response = await createTaskHandler(mockRequest, mockEnv, mockCtx);

			expect(response.status).toBe(400);
		});

		it('should return 400 for invalid priority', async () => {
			const mockRequest = {
				parsedBody: {
					title: 'New Task',
					description: 'Task description',
					dueDate: '2024-12-31T23:59:59Z',
					priority: 'invalid_priority'
				},
				user: mockUser
			} as any;

			const response = await createTaskHandler(mockRequest, mockEnv, mockCtx);

			expect(response.status).toBe(400);
		});

		it('should return 400 for invalid dueDate format', async () => {
			const mockRequest = {
				parsedBody: {
					title: 'New Task',
					description: 'Task description',
					dueDate: 'invalid-date'
				},
				user: mockUser
			} as any;

			const response = await createTaskHandler(mockRequest, mockEnv, mockCtx);

			expect(response.status).toBe(400);
		});

		it('should return 400 when assigned user does not exist', async () => {
			vi.mocked(mockEnv.DB.prepare).mockReturnValue({
				bind: vi.fn().mockReturnThis(),
				first: vi.fn().mockResolvedValue(null) // User not found
			} as any);

			const mockRequest = {
				parsedBody: {
					title: 'New Task',
					description: 'Task description',
					dueDate: '2024-12-31T23:59:59Z',
					assignedTo: 'nonexistent-user'
				},
				user: mockUser
			} as any;

			const response = await createTaskHandler(mockRequest, mockEnv, mockCtx);

			expect(response.status).toBe(400);
		});

		it('should handle database errors gracefully', async () => {
			vi.mocked(mockEnv.DB.prepare).mockReturnValue({
				bind: vi.fn().mockReturnThis(),
				run: vi.fn().mockRejectedValue(new Error('Database error'))
			} as any);

			const mockRequest = {
				parsedBody: {
					title: 'New Task',
					description: 'Task description',
					dueDate: '2024-12-31T23:59:59Z'
				},
				user: mockUser
			} as any;

			const response = await createTaskHandler(mockRequest, mockEnv, mockCtx);

			expect(response.status).toBe(500);
		});
	});

	describe('updateTaskHandler', () => {
		const mockExistingTask = {
			id: 'task123',
			title: 'Existing Task',
			description: 'Existing Description',
			status: 'pending',
			priority: 'medium'
		};

		it('should update task successfully', async () => {
			const mockUpdatedTask = {
				...mockExistingTask,
				title: 'Updated Task',
				status: 'in_progress',
				updatedAt: new Date().toISOString()
			};

			vi.mocked(mockEnv.DB.prepare).mockImplementation((query: string) => {
				if (query.includes('SELECT * FROM tasks WHERE id')) {
					return {
						bind: vi.fn().mockReturnThis(),
						first: vi.fn().mockResolvedValue(query.includes('UPDATE') ? mockUpdatedTask : mockExistingTask)
					} as any;
				}
				if (query.includes('UPDATE tasks SET')) {
					return {
						bind: vi.fn().mockReturnThis(),
						run: vi.fn().mockResolvedValue({ success: true })
					} as any;
				}
				return {
					bind: vi.fn().mockReturnThis(),
					first: vi.fn().mockResolvedValue(mockUpdatedTask)
				} as any;
			});

			const mockRequest = {
				params: { id: 'task123' },
				parsedBody: {
					title: 'Updated Task',
					status: 'in_progress'
				}
			} as any;

			const response = await updateTaskHandler(mockRequest, mockEnv, mockCtx);
			const responseData = await response.json() as any;

			expect(response.status).toBe(200);
			expect(responseData.success).toBe(true);
		});

		it('should return 400 when task ID is missing', async () => {
			const mockRequest = {
				params: {},
				parsedBody: { title: 'Updated Task' }
			} as any;

			const response = await updateTaskHandler(mockRequest, mockEnv, mockCtx);

			expect(response.status).toBe(400);
		});

		it('should return 404 when task is not found', async () => {
			vi.mocked(mockEnv.DB.prepare).mockReturnValue({
				bind: vi.fn().mockReturnThis(),
				first: vi.fn().mockResolvedValue(null)
			} as any);

			const mockRequest = {
				params: { id: 'nonexistent' },
				parsedBody: { title: 'Updated Task' }
			} as any;

			const response = await updateTaskHandler(mockRequest, mockEnv, mockCtx);

			expect(response.status).toBe(404);
		});

		it('should return 400 for invalid status', async () => {
			vi.mocked(mockEnv.DB.prepare).mockReturnValue({
				bind: vi.fn().mockReturnThis(),
				first: vi.fn().mockResolvedValue(mockExistingTask)
			} as any);

			const mockRequest = {
				params: { id: 'task123' },
				parsedBody: { status: 'invalid_status' }
			} as any;

			const response = await updateTaskHandler(mockRequest, mockEnv, mockCtx);

			expect(response.status).toBe(400);
		});

		it('should return 400 for invalid priority', async () => {
			vi.mocked(mockEnv.DB.prepare).mockReturnValue({
				bind: vi.fn().mockReturnThis(),
				first: vi.fn().mockResolvedValue(mockExistingTask)
			} as any);

			const mockRequest = {
				params: { id: 'task123' },
				parsedBody: { priority: 'invalid_priority' }
			} as any;

			const response = await updateTaskHandler(mockRequest, mockEnv, mockCtx);

			expect(response.status).toBe(400);
		});
	});

	describe('deleteTaskHandler', () => {
		const mockExistingTask = {
			id: 'task123',
			title: 'Task to Delete',
			description: 'Task Description'
		};

		it('should delete task successfully', async () => {
			vi.mocked(mockEnv.DB.prepare).mockImplementation((query: string) => {
				if (query.includes('SELECT * FROM tasks')) {
					return {
						bind: vi.fn().mockReturnThis(),
						first: vi.fn().mockResolvedValue(mockExistingTask)
					} as any;
				}
				return {
					bind: vi.fn().mockReturnThis(),
					run: vi.fn().mockResolvedValue({ success: true })
				} as any;
			});

			const mockRequest = {
				params: { id: 'task123' }
			} as any;

			const response = await deleteTaskHandler(mockRequest, mockEnv, mockCtx);
			const responseData = await response.json() as any;

			expect(response.status).toBe(200);
			expect(responseData.success).toBe(true);
			expect(responseData.data.message).toBe('Task deleted successfully');
		});

		it('should return 400 when task ID is missing', async () => {
			const mockRequest = {
				params: {}
			} as any;

			const response = await deleteTaskHandler(mockRequest, mockEnv, mockCtx);

			expect(response.status).toBe(400);
		});

		it('should return 404 when task is not found', async () => {
			vi.mocked(mockEnv.DB.prepare).mockReturnValue({
				bind: vi.fn().mockReturnThis(),
				first: vi.fn().mockResolvedValue(null)
			} as any);

			const mockRequest = {
				params: { id: 'nonexistent' }
			} as any;

			const response = await deleteTaskHandler(mockRequest, mockEnv, mockCtx);

			expect(response.status).toBe(404);
		});

		it('should handle database deletion errors', async () => {
			vi.mocked(mockEnv.DB.prepare).mockImplementation((query: string) => {
				if (query.includes('SELECT * FROM tasks')) {
					return {
						bind: vi.fn().mockReturnThis(),
						first: vi.fn().mockResolvedValue(mockExistingTask)
					} as any;
				}
				return {
					bind: vi.fn().mockReturnThis(),
					run: vi.fn().mockResolvedValue({ success: false })
				} as any;
			});

			const mockRequest = {
				params: { id: 'task123' }
			} as any;

			const response = await deleteTaskHandler(mockRequest, mockEnv, mockCtx);

			expect(response.status).toBe(500);
		});

		it('should handle database errors gracefully', async () => {
			vi.mocked(mockEnv.DB.prepare).mockReturnValue({
				bind: vi.fn().mockReturnThis(),
				first: vi.fn().mockRejectedValue(new Error('Database error'))
			} as any);

			const mockRequest = {
				params: { id: 'task123' }
			} as any;

			const response = await deleteTaskHandler(mockRequest, mockEnv, mockCtx);

			expect(response.status).toBe(500);
		});
	});
});
