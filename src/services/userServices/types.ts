/**
 * 登录入参DTO
 */
export interface UserLoginPayloadDto {
  username: string;
  password: string;
}

/**
 * 登录响应VO
 */
export interface UserLoginPayloadVo {
  username: string;
  userId: string;
}

/**
 * 注册入参DTO
 */
export interface UserRegisterPayloadDto {
  username: string;
  password: string;
  nickname: string;
  phone?: string;
  email?: string;
  confirmPassword: string;
}

/**
 * 注册响应VO
 */
export interface UserRegisterPayloadVo {
  username: string;
}
