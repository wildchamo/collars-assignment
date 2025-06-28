-- Migration number: 0002 	 2025-06-28T19:30:00.000Z

-- Tasks table with INTEGER IDs (consistent with users table)
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending' NOT NULL,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium' NOT NULL,
  due_date DATETIME NOT NULL,
  assigned_to INTEGER, -- Reference to users.id (nullable)
  created_by INTEGER NOT NULL, -- Reference to users.id
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- 📊 INDEXES to optimize queries
-- Primary lookups
CREATE INDEX idx_tasks_status ON tasks(status);                     -- Filter by status
CREATE INDEX idx_tasks_priority ON tasks(priority);                 -- Filter by priority
CREATE INDEX idx_tasks_due_date ON tasks(due_date);                 -- Sort by due date
CREATE INDEX idx_tasks_created_at ON tasks(created_at);             -- Sort by creation date

-- User relationships
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);           -- Find tasks assigned to user
CREATE INDEX idx_tasks_created_by ON tasks(created_by);             -- Find tasks created by user

-- Composite indexes for common queries
CREATE INDEX idx_tasks_assigned_status ON tasks(assigned_to, status);     -- User's tasks by status
CREATE INDEX idx_tasks_status_priority ON tasks(status, priority);        -- Tasks by status + priority
CREATE INDEX idx_tasks_due_date_status ON tasks(due_date, status);        -- Upcoming tasks by status

-- 📊 TRIGGER to update timestamps
CREATE TRIGGER set_tasks_updated_at
AFTER UPDATE ON tasks
FOR EACH ROW
BEGIN
  UPDATE tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
