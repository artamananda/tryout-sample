export type EUserStatus = 'active' | 'inactive';

export interface UserProperties {
  user_id: string;
  username: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | string;
  nisn: string;
  grade: string;
  school: string;
  regency: string;
  province: string;
  picture_url: string;
  created_at: Date | string;
}

export interface ICreateUser extends UserProperties {
  password?: string;
}

export type IChangePassword = {
  oldPassword: '';
  newPassword: '';
  retypePassword: '';
};
type IRoleList = {
  [key: string]: string;
};
export const RoleList: IRoleList = {
  admin: 'Super Admin',
  admin_ecommerce: 'Admin ECommerce',
  admin_marketing: 'Admin Marketing',
  customer: 'Customer'
};

export const initialUser: UserProperties = {
  user_id: '',
  username: '',
  name: '',
  email: '',
  role: '',
  nisn: '',
  grade: '',
  school: '',
  regency: '',
  province: '',
  picture_url: '',
  created_at: ''
};
