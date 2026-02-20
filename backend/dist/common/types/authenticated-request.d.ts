import type { Request } from 'express';
import type { AuthUser } from '../../auth/auth-user.interface';
export type AuthenticatedRequest = Request & {
    supabaseAccessToken: string;
    user: AuthUser;
};
