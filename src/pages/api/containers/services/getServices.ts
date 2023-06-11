import { NextApiRequest, NextApiResponse } from 'next';
import * as k8s from '@kubernetes/client-node';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

const getServices = async (sid: string) => {
  try {
    const res = await k8sApi.listServiceForAllNamespaces();
    const services = res.body.items.filter(service => service.metadata?.name?.includes(sid.toLowerCase()));
    return services;
  } catch (err) {
    console.error(err);
    return [];
  }
};

export default withApiAuthRequired(async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const session = await getSession(req, res);
    const sid = session?.user?.sid;
    if (!sid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const services = await getServices(sid);
    res.status(200).json(services);
  } else {
    res.setHeader('Allow', 'GET');
    res.status(405).end('Method Not Allowed');
  }
});
