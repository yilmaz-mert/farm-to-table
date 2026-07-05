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
};

export default nextConfig;
