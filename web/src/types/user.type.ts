export type EUserStatus = 'active' | 'inactive';

export type Gender = 'male' | 'female' | '';

export type EducationLevel = 'SMA/SMK' | 'D3' | 'D4' | 'S1' | 'S2' | 'S3' | '';

export interface UserProperties {
  user_id: string;
  username: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | string;
  phone_number: string;
  gender: Gender;
  birth_date: string;
  last_education: EducationLevel;
  major: string;
  target_agency: string;
  target_position: string;
  nisn: string;
  grade: string;
  school: string;
  regency: string;
  province: string;
  picture_url: string;
  created_at: Date | string;
  updated_at?: Date | string;
}

/** Fields a user may change about themselves. Email and role are locked. */
export type UpdateMyProfileRequest = Partial<
  Pick<
    UserProperties,
    | 'username'
    | 'name'
    | 'phone_number'
    | 'gender'
    | 'birth_date'
    | 'last_education'
    | 'major'
    | 'target_agency'
    | 'target_position'
    | 'nisn'
    | 'grade'
    | 'school'
    | 'regency'
    | 'province'
  >
>;

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

export interface ICreateUser extends UserProperties {
  password?: string;
}

type IRoleList = {
  [key: string]: string;
};
export const RoleList: IRoleList = {
  admin: 'Admin',
  user: 'Peserta'
};

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Laki-laki' },
  { value: 'female', label: 'Perempuan' }
];

export const EDUCATION_OPTIONS: EducationLevel[] = [
  'SMA/SMK',
  'D3',
  'D4',
  'S1',
  'S2',
  'S3'
];

export const initialUser: UserProperties = {
  user_id: '',
  username: '',
  name: '',
  email: '',
  role: '',
  phone_number: '',
  gender: '',
  birth_date: '',
  last_education: '',
  major: '',
  target_agency: '',
  target_position: '',
  nisn: '',
  grade: '',
  school: '',
  regency: '',
  province: '',
  picture_url: '',
  created_at: ''
};
