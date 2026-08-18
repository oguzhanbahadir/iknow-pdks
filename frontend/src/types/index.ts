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

export interface TaskAttachment {
  id: string;
  taskId: string;
  userId?: string;
  fileName: string;
  filePath: string;
  fileUrl: string;
  fileType: 'image' | 'document';
  fileSize: number;
  mimeType?: string;
  createdAt?: string;
  user?: {
    id: string;
    fullName: string;
    avatar?: string;
  };
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
  projectId?: string;
  project?: {
    id: string;
    name: string;
  };
  estimatedHours: number;
  actualHours: number;
  taskDate?: string;
  startDate?: string;
  dueDate?: string;
  isArchived?: boolean;
  archivedAt?: string;
  createdAt?: string;
  commentsCount?: number;
  attachments?: TaskAttachment[];
  assignedUser?: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface ProjectMember {
  id: string;
  userId: string;
  requestedRole: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  isModerator?: boolean;
  memberRole?: 'MEMBER' | 'MODERATOR' | 'SPECTATOR';
  createdAt?: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    department?: string;
    avatar?: string;
  };
}

export interface RoleRequirement {
  role: string;
  technologies: string[];
  prerequisites: string[];
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  neededRoles: string[];
  roleRequirements?: RoleRequirement[];
  documentation?: string;
  repositoryUrl?: string;
  status: 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED';
  createdById?: string;
  createdAt?: string;
  createdBy?: {
    id: string;
    fullName: string;
  };
  approvedCount?: number;
  pendingCount?: number;
  totalTasksCount?: number;
  completedTasksCount?: number;
  progressPercentage?: number;
  canAccessContent?: boolean;
  myMembership?: {
    id: string;
    requestedRole: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    isModerator?: boolean;
    memberRole?: 'MEMBER' | 'MODERATOR' | 'SPECTATOR';
  };
  members?: ProjectMember[];
  tasks?: TaskItem[];
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  message: string;
  createdAt: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    avatar?: string;
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

export interface ProjectLogItem {
  id: string;
  projectId?: string;
  projectName?: string;
  taskId?: string;
  userId: string;
  action: string;
  title: string;
  details?: Record<string, any>;
  createdAt?: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    avatar?: string;
  };
  task?: {
    id: string;
    title: string;
  };
}

export interface UserEmailAccount {
  id: string;
  emailAddress: string;
  displayName?: string;
  imapHost: string;
  imapPort: number;
  imapEncryption: string;
  smtpHost: string;
  smtpPort: number;
  smtpEncryption: string;
  username: string;
  isActive: boolean;
  lastSyncedAt?: string;
}

export interface EmailAttachment {
  fileName: string;
  size: number;
  mimeType: string;
}

export interface EmailMessageHeader {
  uid: string;
  msgNo: number;
  subject: string;
  fromName: string;
  fromEmail: string;
  date: string;
  isUnread: boolean;
  size: number;
}

export interface EmailMessageDetail {
  uid: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  toEmail: string;
  date: string;
  htmlBody: string;
  plainBody: string;
  attachments?: EmailAttachment[];
}
