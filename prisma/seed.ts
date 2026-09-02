import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "test@patorbit.com";
  const password = "Test1234!";
  const name = "Test User";

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`✅ Test account already exists: ${email}`);
    console.log(`   Password: ${password}`);
    return;
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user with pre-verified email
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      emailVerified: new Date(), // Pre-verified so login works immediately
    },
  });

  // Create ProfessionalIdentity for the user
  await prisma.professionalIdentity.create({
    data: {
      userId: user.id,
    },
  });

  console.log(`✅ Test account created successfully!`);
  console.log(`   Email:    ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`   User ID:  ${user.id}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
