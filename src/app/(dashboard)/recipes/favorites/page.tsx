import { redirect } from "next/navigation";

export default function LegacyFavoritesRedirect() {
  redirect("/recipes/favourites");
}
