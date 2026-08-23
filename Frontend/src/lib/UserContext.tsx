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
}

// Map backend DB role → frontend role
function mapBackendRole(backendRole: string): UserRole {
  switch (backendRole) {
    case 'admin':
    case 'director':    return 'admin';
    case 'reviewer':
    case 'user':
    case 'analyst':     return 'state_reviewer';
    case 'submitter':   return 'submitter';
    default:            return 'viewer';
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

function buildUser(username: string, backendRole: string, id?: string | number): CurrentUser {
  const display = USER_DISPLAY[username] ?? {
    id: id || "1",
    displayName: username.charAt(0).toUpperCase() + username.slice(1),
    department: 'Government Official',
  };
  return { id: id || display.id, username, role: mapBackendRole(backendRole), ...display };
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
  logout: () => void;
  isLoaded: boolean;
}

const UserContext = createContext<UserContextType>({
  user: DEFAULT_USER,
  isLoggedIn: false,
  logout: () => {},
  isLoaded: false,
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser>(DEFAULT_USER);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setIsLoaded(true);
        return;
      }

      // Decode JWT payload (base64url → base64 → JSON)
      const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
      const payload = JSON.parse(atob(padded));

      const username: string = payload.sub || payload.username || '';
      const role: string = payload.role || 'viewer';

      if (username) {
        localStorage.setItem('username', username);
        setUser(buildUser(username, role));
        setIsLoggedIn(true);
      }
    } catch (e) {
      console.error('Error decoding JWT:', e);
    }
    setIsLoaded(true);
  }, []);

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('username');
    setUser(DEFAULT_USER);
    setIsLoggedIn(false);
    window.location.href = '/auth/login';
  };

  return (
    <UserContext.Provider value={{ user, isLoggedIn, logout, isLoaded }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
