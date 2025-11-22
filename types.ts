
export enum Role {
  AGENT = 'Agent',
  ADMIN = 'Admin'
}

export interface User {
  uid: string;
  name: string;
  email: string;
  role: Role;
  photoURL?: string;
  password?: string;
}

export enum LeadStatus {
  NEW_PROSPECT = 'New Prospect',
  NOT_INTERESTED = 'Not Interested',
  FOLLOW_UP = 'Follow-up',
  PAID = 'Paid',
  SECOND_VOICE = '2nd Voice Needed'
}

export enum CallType {
  WORK = 'Work',
  PERSONAL = 'Non-Work'
}

export interface InteractionLog {
  id: string;
  agentName: string;
  agentEmail: string;
  clientName: string;
  phone: string;
  phoneClean: string;
  description: string;
  leadStatus: LeadStatus;
  callType: CallType;
  followUpDate: string; // YYYY-MM-DD
  followUpTime: string; // HH:MM
  isCompleted: boolean;
  secondVoiceRequested: boolean;
  createdAt: number; // Timestamp
}

export interface LeadStats {
  newProspects: number;
  followUpsToday: number;
}

export interface CompanyKnowledge {
  productName: string;
  description: string;
  pricing: string;
  uniqueSellingPoints: string;
  salesPitch: string; // The "Golden Pitch"
  objectionRules: string; // Specific ways to handle common complaints
  masterDocumentText: string; // THE BRAIN: Full text of brochures, PDFs, etc.
}
