/**
 * Authentication API Client
 * Handles all authentication-related API calls
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface LoginCredentials {
    username: string; // Can be email or username
    password: string;
}

export interface RegisterData {
    username: string;
    email: string;
    password: string;
    password_confirm: string;
    first_name?: string;
    last_name?: string;
    phone_number?: string;
}

export interface AuthResponse {
    token: string;
    user: {
        id: number;
        username: string;
        email: string;
        first_name: string;
        last_name: string;
        full_name: string;
        phone_number?: string;
        avatar?: string;
    };
    message: string;
}

export interface ApiError {
    message?: string;
    errors?: Record<string, string[]>;
    detail?: string;
}

/**
 * Login with email or username
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
    });

    if (!response.ok) {
        const error: ApiError = await response.json();
        throw new Error(error.message || error.detail || 'Đăng nhập thất bại');
    }

    return response.json();
}

/**
 * Register new user
 */
export async function register(data: RegisterData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error: ApiError = await response.json();

        // Format validation errors
        if (error.errors) {
            const errorMessages = Object.entries(error.errors)
                .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
                .join('\n');
            throw new Error(errorMessages);
        }

        throw new Error(error.message || error.detail || 'Đăng ký thất bại');
    }

    return response.json();
}

/**
 * Logout user
 */
export async function logout(token: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/auth/logout/`, {
        method: 'POST',
        headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const error: ApiError = await response.json();
        throw new Error(error.message || error.detail || 'Đăng xuất thất bại');
    }
}

/**
 * Request password reset email
 */
export async function forgotPassword(email: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
    });

    if (!response.ok) {
        const error: ApiError = await response.json();
        throw new Error(error.message || error.detail || 'Yêu cầu đặt lại mật khẩu thất bại');
    }

    return response.json();
}

/**
 * Reset password with token
 */
export async function resetPassword(
    uid: string,
    token: string,
    newPassword: string,
    newPasswordConfirm: string
): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            uid,
            token,
            new_password: newPassword,
            new_password_confirm: newPasswordConfirm,
        }),
    });

    if (!response.ok) {
        const error: ApiError = await response.json();

        // Format validation errors
        if (error.errors) {
            const errorMessages = Object.entries(error.errors)
                .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
                .join('\n');
            throw new Error(errorMessages);
        }

        throw new Error(error.message || error.detail || 'Đặt lại mật khẩu thất bại');
    }

    return response.json();
}

/**
 * Get current user data
 */
export async function getCurrentUser(token: string): Promise<AuthResponse['user']> {
    const response = await fetch(`${API_BASE_URL}/auth/me/`, {
        method: 'GET',
        headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const error: ApiError = await response.json();
        throw new Error(error.message || error.detail || 'Không thể lấy thông tin người dùng');
    }

    return response.json();
}
