export interface FileRecord {
  id: string;
  name: string;
  original_name: string;
  type: string;
  size_bytes: number;
  owner: string;
  group_name?: string | null;
  status: 'uploaded' | 'processed' | 'error' | string;
  storage_url: string;
  storage_path: string;
  observations?: string | null;
  faq_generated: boolean;
  faq_validated: boolean;
  created_at?: string;
  uploaded_at: string;
  categories?: string[];
}

export interface FAQRecord {
  id: string;
  file_id: string;
  question: string;
  answer: string;
  status: 'pending' | 'approved' | 'edited' | 'rejected';
  created_at: string;
}
