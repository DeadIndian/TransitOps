// Validated environment. Fail fast at boot rather than with a cryptic runtime error.
// ponytail: hand-rolled check, no schema lib — three vars don't need Zod.
function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const env = {
  DATABASE_URL: required("DATABASE_URL"),
  AUTH_SECRET: required("AUTH_SECRET"),
  NODE_ENV: process.env.NODE_ENV ?? "development",
  isProd: process.env.NODE_ENV === "production",
};
