import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Safety net only — admin Settings sends small JSON payloads (text
      // fields + already-uploaded storage URLs). Actual image bytes never
      // go through a Server Action; they upload straight to Supabase
      // Storage from the client (see admin/settings/page.tsx).
      bodySizeLimit: "10mb",
    },
  },
  images: {
    // Lets next/image optimize admin-uploaded photos served from the
    // public store-media bucket (any Supabase project's subdomain).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    // Next only allows `quality` values listed here (default: [75]).
    // GallerySection.tsx uses quality={80}, hence 80 must be included.
    qualities: [25, 50, 75, 80, 85, 90, 100],
  },
};

export default nextConfig;
