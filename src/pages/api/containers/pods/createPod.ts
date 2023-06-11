import { NextApiRequest, NextApiResponse } from 'next';
import * as k8s from '@kubernetes/client-node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

const createPodManifest = (sid: string, namespace: string, timestamp: number): k8s.V1Pod => ({
  apiVersion: 'v1',
  kind: 'Pod',
  metadata: {
    name: `pod-${sid}-${timestamp}`,
    namespace,
    labels: { app: `pod-${sid}-${timestamp}` }
  },
  spec: {
    containers: [
      {
        name: `container-${sid}`,
        image: 'bendrummond389/debian-ws',
        command: ['sleep'],
        args: ['3600'],
        ports: [{ containerPort: 8080 }]
      }
    ]
  }
});

const createPod = async (userId: number, sid: string, namespace: string, deployment: string, timestamp: number) => {
  try {
    await k8sApi.createNamespacedPod(namespace, createPodManifest(sid, namespace, timestamp));
  } catch (err: unknown) {
    console.error(`Failed to create pod: ${(err as Error).message}`);
    console.error((err as Error).stack);
    throw err;
  }

  let createdPod;
  try {
    createdPod = await prisma.pod.create({
      data: {
        name: `pod-${sid}-${timestamp}`,
        info: 'Created Pod',
        namespace,
        deployment
      }
    });
  } catch (err: unknown) {
    console.error(`Failed to insert pod record into database: ${(err as Error).message}`);
    console.error((err as Error).stack);
    throw err;
  }

  return createdPod;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
    return;
  }

  const { userId, sid, namespace, deployment, timestamp} = req.body;

  try {
    const results = await createPod(userId, sid, namespace, deployment, timestamp);
    res.status(201).json(results);
  } catch (err: unknown) {
    console.error(err);
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred.' });
    }
  }
}