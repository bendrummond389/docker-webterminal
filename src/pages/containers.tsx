import { useState, useEffect } from 'react';
import { User } from '@prisma/client';
import Button from '@mui/material/Button';
import useSWR from 'swr';
import { ContainerList } from '@/components/ContainerList';

// Create a type for the pod creation payload
interface PodCreationPayload {
  userId: number;
  sid: string,
  namespace: string;
  deployment: string;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

const Containers: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const { data: fetchedUser, error } = useSWR<User>('/api/user', fetcher);

  useEffect(() => {
    if (fetchedUser) {
      setUser(fetchedUser);
    }
  }, [fetchedUser]);

  const fetchPods = async () => {
    const res = await fetch('/api/containers/pods/getPods');
    const pods = await res.json();
    console.log(pods);
  };
  const fetchServices = async () => {
    const res = await fetch('/api/containers/getServices');
    const services = await res.json();
    console.log(services);
  };
  const fetchIngresses = async () => {
    const res = await fetch('/api/containers/getIngresses');
    const ingresses = await res.json();
    console.log(ingresses);
  };

  const createNode = async (payload: PodCreationPayload) => {
    const response = await fetch('/api/containers/createNode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  
    if (response.ok) {
      const pod = await response.json();
      console.log('Pod created successfully: ', pod);
    } else {
      const errorResponse = await response.json();
      console.error('Failed to create pod. Response: ', errorResponse);
    }
  };
  

  const handleCreatePod = () => {
    if (!user) {
      console.error("User is null. Can't create pod.");
      return;
    }
  
    const namespace = `user-${user.sid}`.toLowerCase();
    const deployment = `deployment-for-${user.sid}`.toLowerCase();
  
    const payload: PodCreationPayload = {
      userId: user.id,
      sid: user.sid,
      namespace,
      deployment
    };
    console.log('Payload:', payload);
    createNode(payload);
  };

  if (error) return <div>Failed to load user</div>;
  if (!user) return <div>Loading...</div>;

  return (
    <>
      <Button onClick={fetchPods}>Get Pods</Button>
      <Button onClick={fetchServices}>Get Services</Button>
      <Button onClick={fetchIngresses}>Get Ingresses</Button>
      <Button onClick={handleCreatePod}>Create Pods</Button>

      <ContainerList />
      <h1> hello</h1>
    </>
  );
};

export default Containers;
