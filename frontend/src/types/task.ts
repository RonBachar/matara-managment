export type TaskStatus = "לביצוע" | "בתהליך" | "ממתין" | "הושלם";

export type TaskPriority = "נמוכה" | "בינונית" | "גבוהה";

export type Task = {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
};
