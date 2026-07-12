import { redirect } from "next/navigation";

// Root → dashboard. Unauthenticated requests are bounced to /login by proxy.ts.
export default function Home() {
  redirect("/dashboard");
}
