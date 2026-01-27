export type ContractStatus = 'draft' | 'pending_signature' | 'signed' | 'expired' | 'voided';

export interface Contract {
  id: string;
  title: string;
  description?: string;
  content: string;
  employee_name: string;
  employee_email: string;
  position: string;
  department?: string;
  start_date?: string;
  pay_rate?: number;
  employment_type?: string;
  status: ContractStatus;
  created_by?: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  signed_at?: string;
}

export interface Signature {
  id: string;
  contract_id: string;
  signer_name: string;
  signer_email: string;
  signature_data: string;
  signature_type: 'drawn' | 'typed';
  ip_address?: string;
  user_agent?: string;
  signed_at: string;
}

export interface ContractAuditLog {
  id: string;
  contract_id: string;
  action: string;
  actor_email?: string;
  actor_name?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}
