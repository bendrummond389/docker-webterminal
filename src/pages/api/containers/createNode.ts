import { NextApiRequest, NextApiResponse } from 'next';
import * as k8s from '@kubernetes/client-node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
import * as NetworkingV1Api from '@kubernetes/client-node/dist/gen/api/networkingV1Api';
const k8sNetworkingApi = kc.makeApiClient(NetworkingV1Api.NetworkingV1Api);

interface KubernetesApiError extends Error {
  body?: {
    reason?: string;
  };
}

const handleKubernetesError = (err: KubernetesApiError, entityName: string): void => {
  if (err.body?.reason !== 'AlreadyExists') {
    console.error(`Failed to create ${entityName}: ${err.message}`);
    console.error(err.stack);
    throw err;
  }
};

const createNamespace = async (namespaceName: string) => {
  const manifest: k8s.V1Namespace = {
    apiVersion: 'v1',
    kind: 'Namespace',
    metadata: { name: namespaceName }
  };

  try {
    return await k8sApi.createNamespace(manifest);
  } catch (err) {
    handleKubernetesError(err as KubernetesApiError, 'namespace');
  }
};

const createPod = async (sid: string, namespace: string, timestamp: number) => {
  const manifest: k8s.V1Pod = {
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
  };

  try {
    await k8sApi.createNamespacedPod(namespace, manifest);
  } catch (err) {
    handleKubernetesError(err as KubernetesApiError, 'pod');
  }
};

const createService = async (sid: string, namespace: string, timestamp: number) => {
  const manifest: k8s.V1Service = {
    apiVersion: 'v1',
    kind: 'Service',
    metadata: { name: `service-${sid}-${timestamp}`, namespace },
    spec: {
      selector: { app: `pod-${sid}-${timestamp}` },
      ports: [{ protocol: 'TCP', port: 80, targetPort: 8080 }]
    }
  };

  try {
    await k8sApi.createNamespacedService(namespace, manifest);
  } catch (err) {
    handleKubernetesError(err as KubernetesApiError, 'service');
  }
};

const createIngress = async (sid: string, namespace: string, timestamp: number) => {
  const manifest: k8s.V1Ingress = {
    apiVersion: 'networking.k8s.io/v1',
    kind: 'Ingress',
    metadata: { name: `ingress-${sid}-${timestamp}`, namespace },
    spec: {
      rules: [
        {
          host: `localhost`,
          http: {
            paths: [
              {
                pathType: 'Prefix',
                path: `/${namespace}/service-${sid}-${timestamp}`,
                backend: {
                  service: {
                    name: `service-${sid}-${timestamp}`,
                    port: { number: 80 }
                  }
                }
              }
            ]
          }
        }
      ]
    }
  };

  try {
    await k8sNetworkingApi.createNamespacedIngress(namespace, manifest);
  } catch (err) {
    handleKubernetesError(err as KubernetesApiError, 'ingress');
  }
};

const createEntities = async (userId: number, sid: string, namespace: string, deployment: string) => {
  if (!sid) throw new Error('No sid provided');

  const timestamp = Date.now();
  sid = sid.toLowerCase();

  try {
    await createNamespace(namespace);
    await createPod(sid, namespace, timestamp);
    await createService(sid, namespace, timestamp);
    await createIngress(sid, namespace, timestamp);
  } catch (err) {
    console.error((err as Error).stack);
    throw err;
  }

  const createdPod = await prisma.pod.create({
    data: {
      name: `pod-${sid}-${timestamp}`,
      info: 'Created Pod',
      namespace,
      deployment
    }
  });

  const createdService = await prisma.service.create({
    data: {
      name: `service-${sid}-${timestamp}`,
      info: 'Created Service',
      namespace
    }
  });

  const createdIngress = await prisma.ingress.create({
    data: {
      name: `ingress-${sid}-${timestamp}`,
      info: 'Created Ingress',
      namespace,
      path: `/${namespace}/service-${sid}-${timestamp}`
    }
  });

  await prisma.node.create({
    data: {
      userId,
      podId: createdPod.id,
      serviceId: createdService.id,
      ingressId: createdIngress.id
    }
  });

  return { createdPod, createdService, createdIngress};
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
    return;
  }

  const { userId, sid, namespace, deployment } = req.body;

  try {
    const results = await createEntities(userId, sid, namespace, deployment);
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
