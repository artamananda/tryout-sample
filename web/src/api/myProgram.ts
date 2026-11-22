import { httpRequest } from '../helpers/api';
import { BaseResponseProps } from '../types/config.type';
import {
  CertificateProps,
  LiveClassProps,
  MentoringOverviewProps,
  MentoringSlotProps,
  MyProgramProps,
  ProgramProgressProps,
  ReferralInfoProps
} from '../types/myProgram.type';

type ListPayload<T> = BaseResponseProps<{ count: number; results: T[] }>;

export const getMyPrograms = async () =>
  (await httpRequest.get<ListPayload<MyProgramProps>>('/me/programs')).data.payload.results;

export const getProgramProgress = async (programId: string) =>
  (await httpRequest.get<BaseResponseProps<ProgramProgressProps>>(`/program/${programId}/progress`)).data.payload;

export const claimGuarantee = async (programId: string) =>
  (await httpRequest.post(`/program/${programId}/guarantee`)).data.payload;

export const issueCertificate = async (programId: string) =>
  (await httpRequest.post<BaseResponseProps<CertificateProps>>(`/program/${programId}/certificate`)).data.payload;

export const verifyCertificate = async (number: string) =>
  (await httpRequest.get<BaseResponseProps<CertificateProps>>(`/certificate/${encodeURIComponent(number)}`)).data.payload;

export const getMyLiveClasses = async (programId: string) =>
  (await httpRequest.get<ListPayload<LiveClassProps>>(`/live-class/me?program_id=${programId}`)).data.payload.results;

export const joinLiveClass = async (classId: string) =>
  (await httpRequest.post<BaseResponseProps<{ meeting_url: string }>>(`/live-class/${classId}/join`)).data.payload.meeting_url;

export const getRecording = async (classId: string) =>
  (await httpRequest.get<BaseResponseProps<{ recording_url: string }>>(`/live-class/${classId}/recording`)).data.payload.recording_url;

export const rateLiveClass = async (classId: string, rating: number, comment: string) =>
  httpRequest.post(`/live-class/${classId}/rating`, { rating, comment });

export const getMentoring = async (programId: string) =>
  (await httpRequest.get<BaseResponseProps<MentoringOverviewProps>>(`/program/${programId}/mentoring`)).data.payload;

export const bookMentoring = async (slotId: string) =>
  (await httpRequest.post<BaseResponseProps<MentoringSlotProps>>(`/mentoring/${slotId}/book`)).data.payload;

export const cancelMentoring = async (slotId: string) => httpRequest.post(`/mentoring/${slotId}/cancel`);

export const getReferral = async () =>
  (await httpRequest.get<BaseResponseProps<ReferralInfoProps>>('/me/referral')).data.payload;
