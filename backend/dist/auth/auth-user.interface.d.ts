export interface AuthUser {
    email?: string;
    id: string;
    rawUser: Record<string, unknown>;
    role?: string;
    token: string;
}
