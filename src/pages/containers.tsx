import useSWR from 'swr';
import React, { useEffect, useState } from 'react';
import { User as UserType } from '@prisma/client';
import Button from '@mui/material/Button';

const fetcher = (url: string) => fetch(url).then(res => res.json());

const Containers: React.FC = () => {
  const [user, setUser] = useState<UserType | null>(null);
  const { data: fetchedUser, error } = useSWR<UserType>('/api/user', fetcher);

  useEffect(() => {
    if (fetchedUser) {
      setUser(fetchedUser);
    }
  }, [fetchedUser]);

  const logPods = async () => {
    const res = await fetch('/api/containers/getPods');
    const pods = await res.json();
    console.log(pods);
  };

  const handleGetPods = () => {
    logPods();
  };

  const handleCreatePod = async () => {
    // Validate if user is not null
    if (!user) {
      console.error("User is null. Can't create pod.");
      return;
    }

    // Set the namespace and deployment for the user.
    // Update these values based on your application's requirements.
    const namespace = `namespace-for-${user.id}`;
    const deployment = `deployment-for-${user.id}`;

    // Send POST request to create a new pod
    const response = await fetch('/api/containers/createPods', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: user.id,
        namespace: namespace,
        deployment: deployment
      })
    });

    // Handle the response
    if (response.ok) {
      const pod = await response.json();
      console.log('Pod created successfully: ', pod);
    } else {
      console.error('Failed to create pod. Response: ', response);
    }
  };

  if (error) return <div>Failed to load user</div>;
  if (!user && !fetchedUser) return <div>Loading...</div>;

  return (
    <>
      <Button onClick={handleGetPods}>Get Pods</Button>

      <Button onClick={handleCreatePod}>Create Pods</Button>
    </>
  );
};

export default Containers;
