import { PrismaClient } from '@prisma/client/edge'

const prismaClient = global.__prisma || new PrismaClient();

if (process.env.NODE_ENV === 'development') {
    global.__prisma = prismaClient;
}

export default prismaClient