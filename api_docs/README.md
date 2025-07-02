# Task Management API - Bruno Documentation

This folder contains the complete API documentation for the task management system to use with [Bruno](https://usebruno.com/).

## 📁 Structure

```
api_docs/
├── bruno.json                    # Collection configuration
├── README.md                     # This documentation
├── environments/
│   └── Local.bru                # Local environment variables
├── auth/
│   ├── login.bru                # POST /auth/login
│   └── logout.bru               # POST /auth/logout
├── users/
│   └── create-user.bru          # POST /users (Admin only)
├── assignments/
│   ├── 01-assign-task.bru       # POST /tasks/:id/assign
│   ├── 02-unassign-task.bru     # DELETE /tasks/:id/assign
│   ├── 03-get-user-tasks.bru    # GET /users/:id/tasks
│   └── 04-get-task-assignments.bru # GET /tasks/:id/assignments
└── tasks/
    ├── 01-get-all-tasks.bru     # GET /tasks (with pagination and filters)
    ├── 02-get-task-by-id.bru    # GET /tasks/:id
    ├── 03-create-task.bru       # POST /tasks
    ├── 04-update-task.bru       # PUT /tasks/:id
    └── 05-delete-task.bru       # DELETE /tasks/:id
```

## 🚀 Initial Setup

### 1. Configure Environment Variables

Edit the `environments/Local.bru` file and update the variables:

```
baseUrl: http://localhost:8787  # Your local server URL
authToken: YOUR_JWT_TOKEN_HERE  # JWT token obtained from login
taskId: 1                       # Task ID for testing
userId: 12345                   # User ID for testing
```

### 2. Get Authentication Token

Before using the task endpoints, you need to authenticate:

1. Use the login endpoint (`auth/login.bru`) to get a JWT token
2. Copy the token from the response
3. Update it in the `authToken` environment variable

## 📋 Available Endpoints

### 🔐 Authentication

#### Login - `auth/login.bru`

```json
POST /auth/login
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

#### Logout - `auth/logout.bru`

```http
POST /auth/logout
Authorization: Bearer {{authToken}}
```

### 👥 Users (Admin Only)

#### Create User - `users/create-user.bru`

```json
POST /users
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "role": "user",
  "phoneNumber": "+1234567890"
}
```

### 📋 Task Assignments

#### Assign Task - `assignments/01-assign-task.bru`

```json
POST /tasks/:id/assign
{
  "userId": "12345"
}
```

#### Unassign Task - `assignments/02-unassign-task.bru`

```http
DELETE /tasks/:id/assign
```

#### Get User Tasks - `assignments/03-get-user-tasks.bru`

```
GET /users/:id/tasks?status=pending&priority=high
```

#### Get Task Assignment Info - `assignments/04-get-task-assignments.bru`

```
GET /tasks/:id/assignments
```

### 📋 Tasks

### 1. GET /tasks - Get All Tasks

**File**: `01-get-all-tasks.bru`

**Features**:

- ✅ Complete pagination
- ✅ Multiple filters
- ✅ Flexible sorting

**Query Parameters**:

```
?page=1&limit=10&status=pending&priority=high&sortBy=dueDate&sortOrder=ASC
```

**Usage Examples**:

```
# Basic pagination
GET /tasks?page=1&limit=5

# Filters
GET /tasks?status=pending&priority=high

# My assigned tasks
GET /tasks?assignedTo=USER_ID

# Tasks I created
GET /tasks?createdBy=USER_ID

# Sort by due date
GET /tasks?sortBy=dueDate&sortOrder=ASC
```

### 2. GET /tasks/:id - Get Task by ID

**File**: `02-get-task-by-id.bru`

Gets a specific task by its ID.

### 3. POST /tasks - Create New Task

**File**: `03-create-task.bru`

**Body Example**:

```json
{
  "title": "Implement JWT authentication",
  "description": "Create complete authentication system...",
  "dueDate": "2024-01-15T10:00:00.000Z",
  "status": "pending",
  "priority": "high",
  "assignedTo": "12345"
}
```

**Fields**:

- ✅ **Required**: `title`, `description`, `dueDate`
- ✅ **Optional**: `status`, `priority`, `assignedTo`
- ✅ **Auto-generated**: `id`, `createdBy`, `createdAt`, `updatedAt`

### 4. PUT /tasks/:id - Update Task

**File**: `04-update-task.bru`

**Body Example** (partial update):

```json
{
  "status": "in_progress",
  "priority": "medium",
  "dueDate": "2024-01-20T15:30:00.000Z"
}
```

All fields are optional - only sent fields will be updated.

### 5. DELETE /tasks/:id - Delete Task

**File**: `05-delete-task.bru`

Permanently deletes a task from the system.

## 🔐 Authentication

All endpoints require JWT authentication:

```http
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

## 📊 Implemented Validations

### Status (`status`)

- `pending` (default)
- `in_progress`
- `completed`

### Priority (`priority`)

- `low`
- `medium` (default)
- `high`

### Date Formats

- ISO 8601: `2024-01-15T10:00:00.000Z`

## 🎯 Common Use Cases

### 1. Complete Task Flow

```
1. POST /tasks - Create task
2. GET /tasks/:id - Verify creation
3. PUT /tasks/:id - Update status to "in_progress"
4. PUT /tasks/:id - Mark as "completed"
```

### 2. Task Dashboard

```
1. GET /tasks?status=pending&assignedTo=USER_ID - My pending tasks
2. GET /tasks?status=in_progress&assignedTo=USER_ID - My tasks in progress
3. GET /tasks?createdBy=USER_ID - Tasks I created
```

### 3. Reports

```
1. GET /tasks?status=completed&sortBy=updatedAt&sortOrder=DESC - Recently completed tasks
2. GET /tasks?priority=high&status=pending - Urgent pending tasks
```

## 🔧 Usage Tips

1. **Dynamic Variables**: Use `{{taskId}}` and `{{userId}}` in URLs
2. **Comments**: Uncomment parameters with `~` to include them
3. **Environments**: Easily switch between Local/Staging/Production
4. **Sequences**: Files are numbered to follow a logical flow

## 🐛 Error Codes

- `400`: Bad Request (validation failed)
- `401`: Unauthorized (invalid/missing token)
- `404`: Not Found (resource not found)
- `500`: Internal Server Error

## 📝 Notes

- Maximum 100 items per page in pagination
- JWT tokens have expiration
- `createdBy` fields are automatically extracted from authenticated user
- `updatedAt` dates are automatically updated
