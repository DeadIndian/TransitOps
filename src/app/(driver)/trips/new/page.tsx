import { redirect } from "next/navigation";

// The dispatcher's Create form lives inline on /trips (plan §4), so this legacy
// scaffold route just forwards there.
export default function NewTripPage() {
  redirect("/trips");
}
