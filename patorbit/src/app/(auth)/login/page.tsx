import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
      <Card className="w-full max-w-md p-8">
        <h1 className="mb-6 text-center text-3xl font-bold text-white">
          Sign In
        </h1>

        <form className="space-y-4">
          <Input type="email" placeholder="Email" />

          <Input type="password" placeholder="Password" />

          <Button type="submit" className="w-full">
            Sign In
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Don't have an account?{" "}
          <a href="/register" className="text-cyan-400 hover:underline">
            Create one
          </a>
        </p>
      </Card>
    </main>
  );
}