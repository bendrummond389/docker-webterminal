import { NextApiRequest, NextApiResponse } from 'next';
import * as k8s from '@kubernetes/client-node';
import { PrismaClient } from '@prisma/client';
import * as NetworkingV1Api from '@kubernetes/client-node/dist/gen/api/networkingV1Api';

const prisma = new PrismaClient();
const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
const k8sNetworkingApi = kc.makeApiClient(NetworkingV1Api.NetworkingV1Api);

const createIngressManifest = (sid: string, namespace: string, timestamp: number): k8s.V1Ingress => ({
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
                  port: {
                    number: 80
                  }
                }
              }
            }
          ]
        }
      }
    ]
  }
});

const createIngress = async (
  userId: number,
  sid: string,
  namespace: string,
  deployment: string,
  timestamp: number,
  serviceId: number
) => {
  try {
    await k8sNetworkingApi.createNamespacedIngress(namespace, createIngressManifest(sid, namespace, timestamp));
  } catch (err: unknown) {
    console.error(`Failed to create ingress: ${(err as Error).message}`);
    throw err;
  }

  let createdIngress;
  try {
    createdIngress = await prisma.ingress.create({
      data: {
        name: `ingress-${sid}-${timestamp}`,
        info: 'Created Ingress',
        namespace,
        path: `/${namespace}/service-${sid}-${timestamp}`
      }
    });
  } catch (err: unknown) {
    console.error(`Failed to insert ingress record into database: ${(err as Error).message}`);
    console.error((err as Error).stack);
    throw err;
  }

  return createdIngress;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
    return;
  }

  const { userId, sid, namespace, deployment, timestamp, serviceId } = req.body;

  try {
    const results = await createIngress(userId, sid, namespace, deployment, timestamp, serviceId);
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
