export interface Task {
	id: string;
	title: string;
	description?: string;
	status: 'pending' | 'in-progress' | 'completed';
	assignedUserId?: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface User {
	id: string;
	name: string;
	email: string;
	createdAt: Date;
}

export interface TaskAssignment {
	taskId: string;
	userId: string;
	assignedAt: Date;
}

export interface ApiResponse<T = any> {
	success: boolean;
	data?: T;
	error?: string;
}
