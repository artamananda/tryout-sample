import { httpRequest } from '../helpers/api';
import { BaseResponseProps } from '../types/config.type';
import {
  ChangePasswordRequest,
  UpdateMyProfileRequest,
  UserProperties
} from '../types/user.type';

export const getMyProfile = async () => {
  const res = await httpRequest.get<BaseResponseProps<UserProperties>>('/me');
  return res.data.payload;
};

export const updateMyProfile = async (data: UpdateMyProfileRequest) => {
  const res = await httpRequest.patch<BaseResponseProps<UserProperties>>(
    '/me',
    data
  );
  return res.data.payload;
};

export const changeMyPassword = async (data: ChangePasswordRequest) => {
  await httpRequest.patch('/me/password', data);
};

export const uploadMyPicture = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await httpRequest.post<BaseResponseProps<UserProperties>>(
    '/me/picture',
    formData
  );
  return res.data.payload;
};
