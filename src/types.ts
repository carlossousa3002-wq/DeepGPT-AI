export interface KnowledgeItem {
  id: string;
  concept: string;
  details: string;
  createdAt: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  text: string;
}

export interface Message {
  id: string;
  role: "user" | "model" | "system";
  content: string;
  thinking?: string;
  timestamp: string;
  files?: Array<{ name: string; size: number }>;
  newlyLearned?: { concept: string; details: string };
}
