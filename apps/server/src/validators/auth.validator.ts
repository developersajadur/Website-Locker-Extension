import { z } from 'zod';

const LoginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

const RegisterSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

const RefreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

const VerifyPasswordSchema = z.object({
  body: z.object({
    password: z.string().min(1, 'Password is required'),
  }),
});

export const AuthValidation = {
  LoginSchema,
  RegisterSchema,
  RefreshTokenSchema,
  VerifyPasswordSchema,
};

export type RegisterInput = z.infer<typeof RegisterSchema>['body'];
export type LoginInput = z.infer<typeof LoginSchema>['body'];
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>['body'];
export type VerifyPasswordInput = z.infer<typeof VerifyPasswordSchema>['body'];
