import { GetSession, getSession } from '@auth0/nextjs-auth0';
import { User as UserType } from '@prisma/client';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

const fetchUser = async (setUser: (user: UserType | null) => void) => {
  try {
    const { data: user, error } = useSWR('/api/user', fetcher);
    if (user) setUser(user)
    else return null;
    console.log('wawa');
  } catch {
    return null;
  }
};


export default fetchUser;