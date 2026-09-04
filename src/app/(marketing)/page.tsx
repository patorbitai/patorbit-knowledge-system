import { redirect } from "next/navigation";

/** Root `/` redirects to the canonical `/home` route. */
export default function RootPage() {
  redirect("/home");
}
