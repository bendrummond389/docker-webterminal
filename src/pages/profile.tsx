import React from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

const ProfilePage: React.FC = () => {
  const { data: user, error } = useSWR('/api/user', fetcher);

  if (error) return <div>Failed to load user</div>;
  if (!user) return <div>Loading...</div>;

  return (
    <div>
      <h1>Your Profile</h1>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
      <img src={user.picture} alt={user.name} />
    </div>
  );
};

export default ProfilePage;
