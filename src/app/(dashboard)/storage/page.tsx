import { redirect } from "next/navigation";

export default function LegacyStorageRedirect() {
  redirect("/settings?section=storage");
}
