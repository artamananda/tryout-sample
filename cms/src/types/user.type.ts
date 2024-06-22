import { BaseResponsePaginationProps } from "./config.type";

export interface UserProps {
  user_id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  created_at?: Date | string;
}

export interface FetchAllUserResponse
  extends BaseResponsePaginationProps<UserProps> {
  code: string;
  message: string;
  payload: {
    count: number;
    prev: string;
    next: string;
    results: UserProps[];
  };
}

export type EUserRole =
  | "admin"
  | "admin_ecommerce"
  | "admin_marketing"
  | "customer"
  | "";

export type EUserStatus = "active" | "inactive";

export type UserProperties = {
  userId: string;
  userType: EUserRole;
  name: string;
  email: string;
  phone?: string;
  birthdate?: Date;
  birthcity?: string;
  gender?: "male" | "female";
  province?: string;
  city?: string;
  address?: string;
  profilePic?: string;
  status: EUserStatus;
  updatedAt?: Date;
  createdAt?: Date;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  nickName?: string;
};

export interface ICreateUser extends UserProperties {
  password?: string;
}

export type IChangePassword = {
  oldPassword: "";
  newPassword: "";
  retypePassword: "";
};
type IRoleList = {
  [key: string]: string;
};
export const RoleList: IRoleList = {
  admin: "Super Admin",
  admin_ecommerce: "Admin ECommerce",
  admin_marketing: "Admin Marketing",
  customer: "Customer",
};

export const initialUser: UserProperties = {
  userId: "",
  name: "",
  email: "",
  phone: "",
  gender: "male",
  province: "",
  city: "",
  status: "inactive",
  userType: "customer",
  firstName: "",
  middleName: "",
  lastName: "",
};
