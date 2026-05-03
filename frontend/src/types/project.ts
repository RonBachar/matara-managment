export type ProjectStatus = "התחיל" | "בתהליך עבודה" | "הושלם";

export type Project = {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  projectName: string;
  clientName: string;
  status: ProjectStatus;
  totalAmount: number;
  paidAmount: number;
  notes?: string;
};
