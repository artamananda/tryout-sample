import { ProgramProps } from './program.type';

export interface PackageProps {
  package_id: string;
  program_id: string;
  code: string;
  name: string;
  description: string;
  price: number;
  launch_price?: number | null;
  launch_price_until?: string | null;
  current_price: number;
  is_launch_price: boolean;
  is_free: boolean;
  price_per_session: number;
  normal_value: number;
  savings_percent: number;
  tryout_count: number;
  class_count: number;
  recording_days: number;
  mentoring_sessions: number;
  has_explanation: boolean;
  has_weekly_report: boolean;
  has_study_group: boolean;
  has_certificate: boolean;
  features: string[];
  quota?: number | null;
  remaining_quota?: number | null;
  is_sold_out: boolean;
  badge: string;
  sort_order: number;
  is_owned: boolean;
  is_upgrade: boolean;
  can_purchase: boolean;
}

export interface ProgramPackagesProps {
  program: ProgramProps;
  is_registration_open: boolean;
  owned_package_id?: string | null;
  packages: PackageProps[];
}

export type OrderStatus = 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED' | 'FAILED';

export interface OrderProps {
  order_id: string;
  order_number: string;
  status: OrderStatus;
  amount: number;
  program_id: string;
  package: { package_id: string; code: string; name: string };
  payment_provider: string;
  payment_token?: string;
  payment_url?: string;
  payment_method: string;
  expires_at?: string | null;
  paid_at?: string | null;
  created_at: string;
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, { label: string; color: string }> = {
  PENDING: { label: 'Menunggu Pembayaran', color: 'gold' },
  PAID: { label: 'Lunas', color: 'green' },
  EXPIRED: { label: 'Kedaluwarsa', color: 'default' },
  CANCELLED: { label: 'Dibatalkan', color: 'default' },
  FAILED: { label: 'Gagal', color: 'red' }
};

export const formatRupiah = (value: number) =>
  'Rp' + new Intl.NumberFormat('id-ID').format(value || 0);
