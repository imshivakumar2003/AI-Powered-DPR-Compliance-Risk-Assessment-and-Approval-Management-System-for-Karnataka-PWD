// TOPLINE
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type UserRole = 'admin' | 'state_reviewer' | 'submitter' | 'viewer';

export interface CurrentUser {
  id?: string | number;
  username: string;
  role: UserRole;
  displayName: string;
  state?: string;
  department?: string;
  email?: string;
}

// Map backend DB role → frontend role
export function mapBackendRole(backendRole: string): UserRole {
  const r = (backendRole || '').toLowerCase().trim();
  switch (r) {
    case 'admin':
    case 'director':
      return 'admin';
    case 'reviewer':
    case 'analyst':
    case 'approver':
    case 'state_reviewer':
      return 'state_reviewer';
    case 'user':
    case 'submitter':
    case 'requester':
      return 'submitter';
    case 'viewer':
    default:
      return 'viewer';
  }
}

// Display info per username
const USER_DISPLAY: Record<string, Omit<CurrentUser, 'username' | 'role'>> = {
  admin: { id: "1", displayName: 'Master Admin', department: 'Director General, Karnataka PWD HQ', state: 'Karnataka' },
  user:  { id: "3", displayName: 'Project Requester', department: 'State PWD', state: 'Karnataka' },
  test:  { id: "2", displayName: 'Test User', department: 'DPR Submitter, Karnataka PWD (Belagavi Circle)', state: 'Karnataka' },
  shiva123: { id: "4", displayName: 'Shiva', department: 'General', state: 'Karnataka' },
  Shiva2003: { id: "5", displayName: 'Shiva', department: 'General', state: 'Karnataka' },
  sagar: { id: "6", displayName: 'sagar', department: 'General', state: 'Karnataka' },
  chaya: { id: "7", displayName: 'chaya', department: 'General', state: 'Karnataka' },
};

export function buildUser(username: string, backendRole: string, id?: string | number, fullData?: Partial<CurrentUser>): CurrentUser {
  const display = USER_DISPLAY[username] ?? {
    id: id || "1",
    displayName: fullData?.displayName || (username.charAt(0).toUpperCase() + username.slice(1)),
    department: fullData?.department || 'Government Official',
    state: fullData?.state || 'Karnataka',
  };
  return {
    id: String(id || display.id || "1"),
    username,
    role: mapBackendRole(backendRole),
    displayName: fullData?.displayName || display.displayName,
    department: fullData?.department || display.department,
    state: fullData?.state || display.state || 'Karnataka',
    email: fullData?.email,
    ...fullData
  };
}

const DEFAULT_USER: CurrentUser = {
  username: 'guest',
  role: 'viewer',
  displayName: 'Guest',
  department: 'Unauthenticated',
};

interface UserContextType {
  user: CurrentUser;
  isLoggedIn: boolean;
  login: (token: string, userData?: any) => CurrentUser;
  logout: () => void;
  isLoaded: boolean;
}

const UserContext = createContext<UserContextType>({
  user: DEFAULT_USER,
  isLoggedIn: false,
  login: () => DEFAULT_USER,
  logout: () => {},
  isLoaded: false,
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser>(DEFAULT_USER);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')) : null;
      if (!token) {
        setIsLoaded(true);
        return;
      }

      let username = localStorage.getItem('username') || '';
      let role = localStorage.getItem('role') || '';
      let id: any = null;
      let fullData: any = {};

      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const u = JSON.parse(userStr);
          if (u.username) username = u.username;
          if (u.role) role = u.role;
          if (u.id) id = u.id;
          fullData = u;
        } catch (e) {}
      }

      if (!username || !role) {
        try {
          const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
          const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
          const payload = JSON.parse(atob(padded));
          username = username || payload.sub || payload.username || '';
          role = role || payload.role || 'viewer';
          id = id || payload.id;
          if (payload.full_name && !fullData.displayName) fullData.displayName = payload.full_name;
          if (payload.department && !fullData.department) fullData.department = payload.department;
        } catch (e) {}
      }

      if (username) {
        const computedUser = buildUser(username, role, id, fullData);
        setUser(computedUser);
        setIsLoggedIn(true);
        try {
          document.cookie = `auth_token=${token}; path=/; max-age=28800; SameSite=Lax`;
        } catch (e) {}
      }
    } catch (e) {
      console.error('Error decoding JWT on mount:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const login = (token: string, userData?: any): CurrentUser => {
    let username = userData?.username || '';
    let role = userData?.role || 'viewer';
    let id = userData?.id || userData?.user_id;
    let displayName = userData?.full_name || userData?.displayName;
    let department = userData?.department;
    let state = userData?.state || 'Karnataka';
    let email = userData?.email;

    if ((!username || !role) && token) {
      try {
        const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
        const payload = JSON.parse(atob(padded));
        username = username || payload.sub || payload.username || '';
        if (!userData?.role) role = payload.role || 'viewer';
        if (!id) id = payload.id;
        if (!displayName) displayName = payload.full_name;
        if (!department) department = payload.department;
        if (!email) email = payload.email;
      } catch (e) {
        console.error('Error decoding JWT payload in login:', e);
      }
    }

    const computedUser = buildUser(username, role, id, { displayName, department, state, email });

    // 1. Update React Context state synchronously so all route guards immediately see isLoggedIn: true
    setUser(computedUser);
    setIsLoggedIn(true);
    setIsLoaded(true);

    // 2. Persist to storage & cookies immediately
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('username', computedUser.username);
        localStorage.setItem('role', computedUser.role);
        localStorage.setItem('user', JSON.stringify({
          id: computedUser.id,
          username: computedUser.username,
          role: computedUser.role,
          displayName: computedUser.displayName,
          department: computedUser.department,
          state: computedUser.state,
          email: computedUser.email,
        }));
        sessionStorage.setItem('auth_token', token);
        sessionStorage.setItem('username', computedUser.username);
        sessionStorage.setItem('role', computedUser.role);

        // Universal cookie persistence
        document.cookie = `auth_token=${token}; path=/; max-age=28800; SameSite=Lax`;
        document.cookie = `user_role=${computedUser.role}; path=/; max-age=28800; SameSite=Lax`;
        document.cookie = `username=${computedUser.username}; path=/; max-age=28800; SameSite=Lax`;
      } catch (e) {
        console.error('Error persisting auth session:', e);
      }
    }

    return computedUser;
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('username');
        localStorage.removeItem('role');
        localStorage.removeItem('user');
        sessionStorage.removeItem('auth_token');
        sessionStorage.removeItem('username');
        sessionStorage.removeItem('role');
        document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
        document.cookie = 'user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
        document.cookie = 'username=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
      } catch (e) {}
    }
    setUser(DEFAULT_USER);
    setIsLoggedIn(false);
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
  };

  return (
    <UserContext.Provider value={{ user, isLoggedIn, login, logout, isLoaded }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
