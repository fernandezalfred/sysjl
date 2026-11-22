import type { MetadataRoute } from "next";

// Makes SysJL installable (home screen / desktop app). Opens on the panel; a signed-out
// user is sent to /login from there by the proxy.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/dashboard",
    name: "SysJL",
    short_name: "SysJL",
    description: "Control diario de ventas, compras e ingresos por vendedor.",
    lang: "es",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
