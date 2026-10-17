import { redirect } from "next/navigation";

export default function LegacyTemplatesRedirect() {
  redirect("/settings?section=templates");
}
