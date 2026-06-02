export type Trip = {
  id: string;
  title: string;
  destination: string;
  description?: string;
  startDate: string;
  endDate: string;
  createdBy: string;
  memberIds: string[];
  createdAt: Date;
  updatedAt: Date;
};
