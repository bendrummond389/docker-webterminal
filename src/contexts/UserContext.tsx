'use client';

import ensureUserInDb from '@/util/userDbUtils';
import React, { createContext, useState } from 'react';

export type UserType = {
  given_name: string;
  family_name: string;
  nickname: string;
  name: string;
  picture: string;
  locale: string;
  updated_at: string;
  email: string;
  email_verified: boolean;
  sub: string;
  sid: string;
};

type UserContextType = {
  user: UserType | null;
  setUser: (user: UserType | null) => void;
};

export const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {}
});

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserType | null>(null);

  const handleSetUser = async (newUser: UserType | null) => {
    setUser(newUser);
    if (newUser) {
      await ensureUserInDb(newUser);
    }
  };

  return <UserContext.Provider value={{ user, setUser: handleSetUser }}>{children}</UserContext.Provider>;
};
