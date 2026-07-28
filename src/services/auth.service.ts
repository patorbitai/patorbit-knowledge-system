import bcrypt from "bcrypt";
import { userRepository } from "@/repositories/user.repository";

export class AuthService {
  async register(
    name: string,
    email: string,
    password: string
  ) {
    // Check if email already exists
    const existingUser = await userRepository.findByEmail(email);

    if (existingUser) {
      throw new Error("Email already exists");
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    return userRepository.create({
      name,
      email,
      passwordHash,
    });
  }
}

export const authService = new AuthService();