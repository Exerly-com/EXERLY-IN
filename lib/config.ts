export const SITE = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || "EXERLY",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@example.com"
};

export const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
