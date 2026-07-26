import bcrypt from "bcrypt";
import { RegisterInput } from "@/schemas/auth.schema";
import { userRepository } from "@/repositories/user.repository";

export class AuthService {
  async register(data: RegisterInput) {
    const { name, email, password } = data;

    const existingUser = await userRepository.findByEmail(email);

    if (existingUser) {
      throw new Error("Email already exists");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    return userRepository.create({
      name,
      email,
      passwordHash,
    });
  }
}

export const authService = new AuthService();