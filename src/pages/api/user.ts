import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { NextApiRequest, NextApiResponse } from 'next';

export default withApiAuthRequired(async function user(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession(req, res);
  const user = session?.user;

  if (!user) {
    return res.status(404).json({ message: 'Not found' });
  }

  return res.status(200).json(user);
});
