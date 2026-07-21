// apps/web/src/app/(auth)/session-expired/page.tsx
export default function SessionExpiredPage() {
  return (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold">Session Expired</h1>
      <p className="mt-4 text-muted-foreground">
        Please sign in again to continue.
      </p>
      <a
        href="/sign-in"
        className="mt-6 inline-block bg-primary text-primary-foreground px-4 py-2 rounded"
      >
        Sign In
      </a>
    </div>
  );
}
