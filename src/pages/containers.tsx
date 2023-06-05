import useSWR from 'swr';
import React, { useEffect, useState } from 'react';
import { UserType } from '@/contexts/UserContext';

const fetcher = (url: string) => fetch(url).then(res => res.json());

const Containers: React.FC = () => {
  const [user, setUser] = useState<UserType | null>(null);
  const { data: fetchedUser, error } = useSWR<UserType>('/api/user', fetcher);

  useEffect(() => {
    if (fetchedUser && user !== fetchedUser) {
      setUser(fetchedUser);
    }
  }, [fetchedUser]);

  if (error) return <div>Failed to load user</div>;
  if (!user) return <div>Loading...</div>;

  // Display user name in the DOM
  return <div>{user.name}</div>;
};

export default Containers;
