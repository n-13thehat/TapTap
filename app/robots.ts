import { type MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: [
          "/admin",
          "/admin/*",
          "/debug",
          "/debug-signin",
          "/test",
          "/test-*",
          "/blueprint",
          "/blueprint/*",
          "/api",
          "/api/*",
        ],
      },
    ],
  };
}
