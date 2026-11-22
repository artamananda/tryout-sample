export interface MyProgramProps {
  program_id: string;
  program_name: string;
  start_time: string;
  end_time: string;
  package_name: string;
  package_code: string;
  tryout_limit: number;
  class_count: number;
  mentoring_sessions: number;
  has_guarantee: boolean;
  has_certificate: boolean;
}

export interface TryoutProgressProps {
  tryout_id: string;
  sequence: number;
  title: string;
  completed: boolean;
  total_score: number;
  scores?: Record<string, number>;
  passed_all: boolean;
  weakest_subtest?: string;
  rank?: number;
  participants?: number;
  start_time: string;
  end_time: string;
}

export interface ProgramProgressProps {
  program_id: string;
  program_name: string;
  package_name: string;
  tryout_limit: number;
  tryouts: TryoutProgressProps[];
  completed_count: number;
  all_completed: boolean;
  study_group_url?: string;
  guarantee?: {
    included: boolean;
    eligible: boolean;
    reason: string;
    first_score: number;
    last_score: number;
    claim_status?: string;
  };
  certificate?: {
    included: boolean;
    eligible: boolean;
    reason: string;
    certificate_number?: string;
    issued_at?: string;
  };
}

export interface LiveClassProps {
  class_id: string;
  program_id: string;
  sequence: number;
  title: string;
  description: string;
  tutor_name: string;
  starts_at: string;
  ends_at: string;
  status: 'UPCOMING' | 'LIVE' | 'FINISHED';
  has_access: boolean;
  locked_reason?: string;
  can_join: boolean;
  join_opens_at: string;
  has_recording: boolean;
  recording_expires_at?: string;
  attended: boolean;
  my_rating?: number;
  can_rate: boolean;
}

export interface MentoringSlotProps {
  slot_id: string;
  tutor_name: string;
  starts_at: string;
  duration_minutes: number;
  status: string;
  is_mine: boolean;
  can_cancel: boolean;
  meeting_url?: string;
}

export interface MentoringOverviewProps {
  allowed: number;
  used: number;
  remaining: number;
  slots: MentoringSlotProps[];
}

export interface ReferralInfoProps {
  code: string;
  discount_amount: number;
  bonus_tryouts_per_referral: number;
  paid_referrals: number;
  bonus_tryouts_earned: number;
}

export interface CertificateProps {
  certificate_number: string;
  participant_name: string;
  program_name: string;
  package_name: string;
  best_score: number;
  tryouts_completed: number;
  issued_at: string;
}
