import { post } from "@/utils/request";

import type {
  UserRegisterPayloadDto,
  UserRegisterPayloadVo,
  UserLoginPayloadDto,
  UserLoginPayloadVo,
} from "./types.ts";

/**
 * 登录
 */

export const userLogin = (payload: UserLoginPayloadDto): Promise<UserLoginPayloadVo> => {
  return post("/user/login", { ...payload });
};

/**
 * 注册
 */

export const userRegister = (payload: UserRegisterPayloadDto): Promise<UserRegisterPayloadVo> => {
  return post("/user/register", { ...payload });
};
