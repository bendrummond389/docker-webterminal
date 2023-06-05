import { NextPageContext } from 'next';

const LoginPage = () => {
  return <></>; // you can replace null with <></> for react fragment
};

export async function getServerSideProps({ res }: NextPageContext) {
  if (res) {
    res.writeHead(302, { Location: '/api/auth/login' });
    res.end();
  }

  return { props: {} };
}

export default LoginPage;
