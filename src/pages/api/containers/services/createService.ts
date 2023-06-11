import { NextApiRequest, NextApiResponse } from 'next';
import * as k8s from '@kubernetes/client-node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

const createServiceManifest = (sid: string, namespace: string, timestamp: number): k8s.V1Service => ({
  apiVersion: 'v1',
  kind: 'Service',
  metadata: { name: `service-${sid}-${timestamp}`, namespace },
  spec: {
    selector: { app: `pod-${sid}-${timestamp}` },
    ports: [{ protocol: 'TCP', port: 80, targetPort: 8080 }]
  }
});

const createService = async (userId: number, sid: string, namespace: string, deployment: string, timestamp: number, podId: number) => {
  try {
    await k8sApi.createNamespacedService(namespace, createServiceManifest(sid, namespace, timestamp));
  } catch (err: unknown) {
    console.error(`Failed to create service: ${(err as Error).message}`);
    console.error((err as Error).stack);
    throw err;
  }

  let createdService;
  try {
    createdService = await prisma.service.create({
      data: {
        name: `service-${sid}-${timestamp}`,
        info: 'Created Service',
        namespace
      }
    });
  } catch (err: unknown) {
    console.error(`Failed to insert service record into database: ${(err as Error).message}`);
    console.error((err as Error).stack);
    throw err;
  }

  return createdService;
};


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
    return;
  }

  const { userId, sid, namespace, deployment, timestamp, podId} = req.body;

  try {
    const results = await createService(userId, sid, namespace, deployment, timestamp, podId);
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

