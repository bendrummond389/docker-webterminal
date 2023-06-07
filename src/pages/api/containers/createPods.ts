import { NextApiRequest, NextApiResponse } from 'next';
import * as k8s from '@kubernetes/client-node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

const createPod = async (userId: number, namespace: string, deployment: string) => {
  try {
    const timestamp = Date.now();
    // create the Pod
    const podManifest: k8s.V1Pod = {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: {
        name: `pod-${userId}-${timestamp}`,
        namespace: namespace
      },
      spec: {
        containers: [
          {
            name: `container-${userId}`,
            image: 'debian',
            command: ['sleep'],
            args: ['3600'] // Sleep for 1 hour
          }
        ]
      }
    };

    await k8sApi.createNamespacedPod(namespace, podManifest);

    // save the Pod info in DB
    const createdPod = await prisma.container.create({
      data: {
        name: `pod-${userId}-${timestamp}`,
        info: 'Created Pod',
        userId: userId,
        namespace: namespace,
        deployment: deployment
      }
    });

    return createdPod;
  } catch (err) {
    console.error(err);
    return null;
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // you might want to validate the request body here
    const { userId, namespace, deployment } = req.body;
    const pod = await createPod(userId, namespace, deployment);
    res.status(201).json(pod);
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}
