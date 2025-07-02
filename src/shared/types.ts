export interface Task {
	id: string;
	title: string;
	description?: string;
	status: 'pending' | 'in-progress' | 'completed';
	assignedUserId?: string;
	createdAt: Date;
	updatedAt: Date;
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

// Authentication types
export interface AuthUser {
	id: string;
	name: string;
	email: string;
	role: 'admin' | 'user';
}

export interface LoginRequest {
	email: string;
	password: string;
}

export interface RegisterRequest {
	name: string;
	email: string;
	phoneNumber: string;
	password: string;
}

export interface AuthResponse {
	token: string;
}

export interface JWTPayload {
	userId: string;
	email: string;
	role: 'admin' | 'user';
	tokenVersion: number;
	iat: number;
	exp: number;
}


