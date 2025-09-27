import { ApiService } from './api';
import { API_ENDPOINTS } from '../config/api';

export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: string;
  lastLogin?: string;
  createdAt: string;
  preferences?: UserPreferences;
  trackedSatellites?: any[];
  unreadAlerts?: number;
}

export interface UserPreferences {
  id: string;
  theme: string;
  notifications: boolean;
  emailAlerts: boolean;
  defaultView: string;
  trackingRadius: number;
  alertThreshold: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

export interface RegisterResponse {
  message: string;
  user: Omit<User, 'preferences' | 'trackedSatellites' | 'unreadAlerts'>;
}

class AuthService extends ApiService {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await this.post<LoginResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials
    );
    
    // Store token and user data
    localStorage.setItem('auth_token', response.token);
    localStorage.setItem('user_data', JSON.stringify(response.user));
    
    return response;
  }

  async register(data: RegisterData): Promise<RegisterResponse> {
    return this.post<RegisterResponse>(API_ENDPOINTS.AUTH.REGISTER, data);
  }

  async logout(): Promise<void> {
    try {
      await this.post(API_ENDPOINTS.AUTH.LOGOUT);
    } finally {
      // Clear local storage regardless of API call success
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
    }
  }

  async getCurrentUser(): Promise<{ user: User }> {
    return this.get<{ user: User }>(API_ENDPOINTS.AUTH.ME);
  }

  async updateProfile(data: Partial<Pick<User, 'firstName' | 'lastName' | 'username'>>): Promise<{ message: string; user: User }> {
    return this.put<{ message: string; user: User }>(
      API_ENDPOINTS.AUTH.PROFILE,
      data
    );
  }

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ message: string }> {
    return this.put<{ message: string }>(API_ENDPOINTS.AUTH.PASSWORD, data);
  }

  async refreshToken(): Promise<{ message: string; token: string }> {
    const response = await this.post<{ message: string; token: string }>(
      API_ENDPOINTS.AUTH.REFRESH
    );
    
    // Update stored token
    localStorage.setItem('auth_token', response.token);
    
    return response;
  }

  getStoredUser(): User | null {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }

  getStoredToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  isAuthenticated(): boolean {
    return !!this.getStoredToken();
  }

  hasRole(requiredRoles: string[]): boolean {
    const user = this.getStoredUser();
    return user ? requiredRoles.includes(user.role) : false;
  }

  isAdmin(): boolean {
    return this.hasRole(['ADMIN']);
  }

  isAnalyst(): boolean {
    return this.hasRole(['ADMIN', 'ANALYST']);
  }
}

export const authService = new AuthService();
export default authService;