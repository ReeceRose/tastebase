import type { MetadataRoute } from "next";

// Installing Tastebase from the browser adds it to the phone's share sheet on
// Android, so a recipe link can be shared straight into an import.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tastebase",
    short_name: "Tastebase",
    description: "Your household's recipes",
    start_url: "/",
    display: "standalone",
    background_color: "#f1f3ec",
    theme_color: "#234a2f",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    share_target: {
      action: "/recipes/new",
      method: "GET",
      params: { title: "title", text: "text", url: "url" },
    },
  };
}
