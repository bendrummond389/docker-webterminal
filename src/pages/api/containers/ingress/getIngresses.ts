import { NextApiRequest, NextApiResponse } from 'next';
import * as k8s from '@kubernetes/client-node';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const k8sNetworkingApi = kc.makeApiClient(k8s.NetworkingV1Api);

const getIngresses = async (sid: string) => {
  try {
    const res = await k8sNetworkingApi.listIngressForAllNamespaces();
    const ingresses = res.body.items.filter(ingress => ingress.metadata?.name?.includes(sid.toLowerCase()));
    return ingresses;
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
    const ingresses = await getIngresses(sid);
    res.status(200).json(ingresses);
  } else {
    res.setHeader('Allow', 'GET');
    res.status(405).end('Method Not Allowed');
  }
});
