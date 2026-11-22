import { httpRequest } from "../helpers/api";

export type LiveClass = {
  class_id: string;
  program_id: string;
  sequence: number;
  title: string;
  description: string;
  tryout_id?: string | null;
  tutor_name: string;
  starts_at: string;
  ends_at: string;
  status: string;
  meeting_url?: string;
  recording_url?: string;
  attendees?: number;
  rating_count?: number;
  rating_avg?: number;
};

export type MentoringSlot = {
  slot_id: string;
  tutor_name: string;
  starts_at: string;
  duration_minutes: number;
  status: string;
  meeting_url?: string;
  notes?: string;
  booked_by?: { name: string; email: string; phone_number: string };
};

export type GuaranteeClaim = {
  claim_id: string;
  user?: { name: string; email: string; phone_number: string };
  program_id: string;
  first_score: number;
  last_score: number;
  status: string;
  target_program_id?: string;
  admin_note?: string;
  created_at: string;
};

const results = <T,>(res: any): T[] => res.data?.payload?.results || [];

export const apiGetLiveClasses = async (programId: string) =>
  results<LiveClass>(await httpRequest.get(`/admin/program/${programId}/live-classes`));
export const apiCreateLiveClass = async (data: Record<string, unknown>) => (await httpRequest.post("/live-class", data)).data?.payload;
export const apiUpdateLiveClass = async (id: string, data: Record<string, unknown>) =>
  (await httpRequest.patch(`/live-class/${id}`, data)).data?.payload;
export const apiDeleteLiveClass = async (id: string) => httpRequest.delete(`/live-class/${id}`);

export const apiGetMentoringSlots = async (programId: string) =>
  results<MentoringSlot>(await httpRequest.get(`/admin/program/${programId}/mentoring`));
export const apiCreateMentoringSlots = async (data: Record<string, unknown>) =>
  (await httpRequest.post("/mentoring/slots", data)).data?.payload as { created: number };
export const apiUpdateMentoringSlot = async (id: string, data: Record<string, unknown>) => httpRequest.patch(`/mentoring/${id}`, data);
export const apiDeleteMentoringSlot = async (id: string) => httpRequest.delete(`/mentoring/${id}`);

export const apiGetTutorFees = async (programId: string) => (await httpRequest.get(`/admin/program/${programId}/tutor-fees`)).data?.payload;

export const apiGetGuaranteeClaims = async (status?: string) =>
  results<GuaranteeClaim>(await httpRequest.get(`/admin/guarantee-claims${status ? `?status=${status}` : ""}`));
export const apiReviewGuaranteeClaim = async (id: string, data: Record<string, unknown>) =>
  (await httpRequest.patch(`/admin/guarantee-claims/${id}`, data)).data?.payload;

export const apiGetWeeklyNote = async () => (await httpRequest.get("/admin/weekly-report/note")).data?.payload?.note as string;
export const apiSetWeeklyNote = async (note: string) => httpRequest.put("/admin/weekly-report/note", { note });
export const apiRunWeeklyReport = async (programId: string | undefined, dryRun: boolean) => {
  const query = new URLSearchParams();
  if (programId) query.append("program_id", programId);
  if (dryRun) query.append("dry_run", "true");
  return (await httpRequest.post(`/admin/weekly-report/run?${query.toString()}`)).data?.payload;
};

export const apiGetPrograms = async () =>
  results<{ program_id: string; name: string }>(await httpRequest.get("/program"));
export const apiGetProgramTryouts = async () =>
  results<{ tryout_id: string; title: string; program_id?: string; sequence?: number }>(await httpRequest.get("/tryout"));
