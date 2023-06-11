import React, { useEffect, useState } from 'react';
import { Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import dynamic from 'next/dynamic';

const WebTerminal = dynamic(() => import('../../src/components/WebTerminal'), { ssr: false });

interface Ingress {
  id: number;
  name: string;
  info: string;
  serviceId: number;
  namespace: string;
  path: string;
}

interface Service {
  metadata: {
    name: string;
    namespace: string;
  };
  spec: {
    selector: {
      app: string;
    };
    ports: [
      {
        protocol: string;
        port: number;
        targetPort: number;
      }
    ];
  };
  // Database specific fields
  id: number;
  info: string;
  podId: number;
  ingress: Ingress;
}

interface Pod {
  metadata: {
    name: string;
    namespace: string;
  };
  status: {
    phase: string;
    hostIP: string;
    podIP: string;
    startTime: string;
  };
  service: Service;
}

export const ContainerList = () => {
  const [pods, setPods] = useState<Pod[]>([]);
  const [openTerminal, setOpenTerminal] = useState(false);
  const [selectedPod, setSelectedPod] = useState<Pod | null>(null);

  const fetchPods = async () => {
    const res = await fetch('/api/containers/pods/getPods');
    let podsData: Pod[] = await res.json();
    podsData = podsData.filter(pod => pod.metadata.namespace !== 'kube-system' && pod.metadata.namespace !== 'default');
    setPods(podsData);
  };

  useEffect(() => {
    fetchPods();
  }, []);

  const handleOpenTerminal = (pod: Pod) => {
    setSelectedPod(pod);
    setOpenTerminal(true);
  };

  const handleCloseTerminal = () => {
    setOpenTerminal(false);
  };

  return (
    <>
      {openTerminal && selectedPod && selectedPod.service && selectedPod.service.ingress && (
        <WebTerminal ingressPath={selectedPod.service.ingress.path} onClose={handleCloseTerminal} />
      )}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Phase</TableCell>
              <TableCell>Host IP</TableCell>
              <TableCell>Pod IP</TableCell>
              <TableCell>Start Time</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pods.map((pod, index) => (
              <TableRow key={index}>
                <TableCell>{pod.metadata.name}</TableCell>
                <TableCell>{pod.status.phase}</TableCell>
                <TableCell>{pod.status.hostIP}</TableCell>
                <TableCell>{pod.status.podIP}</TableCell>
                <TableCell>{pod.status.startTime}</TableCell>
                <TableCell>
                  <Button variant="contained" color="primary" onClick={() => handleOpenTerminal(pod)}>
                    Open Terminal
                  </Button>
                  <Button></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};


