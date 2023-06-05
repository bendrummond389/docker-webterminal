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

export { getPods };
