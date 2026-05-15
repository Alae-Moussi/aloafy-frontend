export interface User {
    id?: number;
    name?: string;
    email?: string;
    role?: 'USER' | 'ADMIN';
    createdAt?: string;
    updatedAt?: string;
}

export interface LoginRequest {
    email?: string;
    password?: string;
}

export interface SignUpRequest {
    name?: string;
    email?: string;
    password?: string;
}

export interface AuthResponse {
    id?: number;
    name?: string;
    email?: string;
    role?: 'USER' | 'ADMIN';
    accessToken?: string;
    refreshToken?: string;
}

export interface MessageResponse {
    message: string;
}

export interface ErrorResponse {
    timestamp: string;
    status: number;
    error: string;
    message: string;
    path: string;
    errors?: string[];
}

export interface TokenRefreshResponse {
    accessToken: string;
}

export interface UpdateUserProfileRequest {
    name?: string;
    password?: string;
    oldPassword?: string;
}

export interface PageResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    last: boolean;
    first: boolean;
    size: number;
    number: number;
}