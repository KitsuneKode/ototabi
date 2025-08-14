import { prisma } from '../index'

// prisma
//   .$connect()
//   .then(() => {
//     console.log('Connected to database')
//   })
//   .catch((e) => {
//     console.error(e)
//   })
//   .finally(() => {
//     prisma.$disconnect()
//   })

prisma.user
  .createMany({
    data: [
      {
        id: '1',
        name: 'John Doe',
        email: 'john.doe@example.com',
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  })
  .then(() => {
    console.log('Seeding completed')
  })
  .catch((e) => {
    console.error(e)
  })
//   .finally(() => {
//     prisma.$disconnect()
//   })
