import { UserType } from '@/contexts/UserContext';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function ensureUserInDb(userContextData: UserType | null) {
  const user = userContextData;

  if (!user) {
    return;
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email: user.email
    }
  });

  if (!existingUser) {
    const newUser = await prisma.user.create({
      data: {
        auth0Id: user.sid, 
        name: user.name,
        email: user.email
      }
    });

    console.log(`Added new user ${newUser.name} to the database.`);
  } else {
    console.log(`User ${existingUser.name} already exists in the database.`);
  }
}

export default ensureUserInDb;
