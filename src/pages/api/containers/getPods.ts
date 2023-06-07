import { NextApiRequest, NextApiResponse } from 'next';
import * as k8s from '@kubernetes/client-node';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

const getPods = async () => {
  try {
    const res = await k8sApi.listPodForAllNamespaces();
    return res.body.items;
  } catch (err) {
    console.error(err);
    return [];
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const pods = await getPods();
    res.status(200).json(pods);
  } else {
    res.setHeader('Allow', 'GET');
    res.status(405).end('Method Not Allowed');
  }
}
