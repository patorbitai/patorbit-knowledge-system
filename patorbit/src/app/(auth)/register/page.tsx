"use client";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  registerSchema,
  RegisterInput,
} from "@/schemas/auth.schema";

import { registerUser } from "@/actions/auth/register";

export default function RegisterPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
      <Card className="w-full max-w-md p-8">
        <h1 className="mb-6 text-center text-3xl font-bold text-white">
          Create Account
        </h1>

        <form className="space-y-4">
          <Input
            type="text"
            placeholder="Full Name"
          />

          <Input
            type="email"
            placeholder="Email"
          />

          <Input
            type="password"
            placeholder="Password"
          />

          <Input
            type="password"
            placeholder="Confirm Password"
          />

          <Button
            type="submit"
            className="w-full"
          >
            Create Account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <a href="/login" className="text-cyan-400 hover:underline">
            Sign In
          </a>
        </p>
      </Card>
    </main>
  );
}