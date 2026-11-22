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
  is_active: boolean;
}

export type OrderStatus = "PENDING" | "PAID" | "EXPIRED" | "CANCELLED" | "FAILED";

export interface OrderProps {
  order_id: string;
  order_number: string;
  status: OrderStatus;
  amount: number;
  program_id: string;
  package: { package_id: string; code: string; name: string };
  user?: { user_id: string; name: string; email: string; phone_number: string };
  payment_provider: string;
  payment_method: string;
  provider_reference?: string;
  expires_at?: string | null;
  paid_at?: string | null;
  created_at: string;
}

export const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  PENDING: "gold",
  PAID: "green",
  EXPIRED: "default",
  CANCELLED: "default",
  FAILED: "red",
};

export const formatRupiah = (value: number) =>
  "Rp" + new Intl.NumberFormat("id-ID").format(value || 0);
