import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LandlordForge",
    short_name: "LandlordForge",
    description: "A dead-simple landlord operating system with a tenant portal and persistent messaging.",
    start_url: "/",
    display: "standalone",
    background_color: "#09141d",
    theme_color: "#0f766e",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/icon-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
