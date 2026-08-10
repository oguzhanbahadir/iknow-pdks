export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'USER';
  department?: string;
  phone?: string;
  telegram_chat_id?: string;
  avatar?: string;
  targetCompany?: string;
  companyIntegrationNote?: string;
  isOnboarded?: boolean;
  isApproved?: boolean;
  primaryDomain?: string;
  knownSkills?: string[];
  preferredCareerPath?: string;
  toolsUsed?: string[];
  experienceLevel?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  category?: string;
  assignedUserId: string;
  createdById?: string;
  estimatedHours: number;
  actualHours: number;
  taskDate?: string;
  assignedUser?: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface InternScoreItem {
  id: string;
  techScore: number;
  softSkillScore: number;
  punctualityScore: number;
  overallScore: number;
  feedbackNote?: string;
}

export interface CvItem {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  createdAt?: string;
}

export interface PersonelDetail extends User {
  scores?: InternScoreItem[];
  cvFiles?: CvItem[];
  tasksAssigned?: TaskItem[];
}
