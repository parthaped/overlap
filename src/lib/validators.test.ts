import { describe, expect, it } from "vitest";

import { signUpSchema } from "@/lib/validators";

describe("signUpSchema", () => {
  it("accepts valid input", () => {
    const result = signUpSchema.safeParse({
      name: "Alex Mercer",
      email: "alex@example.com",
      password: "password123",
      rememberMe: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects short password", () => {
    const result = signUpSchema.safeParse({
      name: "Alex Mercer",
      email: "alex@example.com",
      password: "short",
      rememberMe: true,
    });
    expect(result.success).toBe(false);
  });

  it("normalizes email validation", () => {
    const result = signUpSchema.safeParse({
      name: "Alex Mercer",
      email: "not-an-email",
      password: "password123",
      rememberMe: true,
    });
    expect(result.success).toBe(false);
  });
});
