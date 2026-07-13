import { describe, it, expect } from "vitest";
import { getDeployStage } from "@/lib/deploy-guide";

describe("getDeployStage", () => {
  it("VERCEL_ENV=production → production", () => {
    const r = getDeployStage({
      VERCEL_ENV: "production",
      VERCEL_GIT_COMMIT_REF: "refs/heads/main",
    });
    expect(r.stage).toBe("production");
    expect(r.baseUrl).toBe("https://alexendros.dev");
  });

  it("VERCEL_ENV=preview → preview", () => {
    const r = getDeployStage({
      VERCEL_ENV: "preview",
      VERCEL_GIT_COMMIT_REF: "refs/heads/feat/cool-thing",
    });
    expect(r.stage).toBe("preview");
    expect(r.baseUrl).toBeNull();
  });

  it("VERCEL_ENV=development → development", () => {
    const r = getDeployStage({
      VERCEL_ENV: "development",
      VERCEL_GIT_COMMIT_REF: "refs/heads/develop",
    });
    expect(r.stage).toBe("development");
    expect(r.baseUrl).toBe("http://localhost:3000");
  });

  it("sin VERCEL_ENV ni ref → development local", () => {
    const r = getDeployStage({});
    expect(r.stage).toBe("development");
    expect(r.baseUrl).toBe("http://localhost:3000");
  });

  it("ref=main sin VERCEL_ENV → production (fallback)", () => {
    const r = getDeployStage({ VERCEL_GIT_COMMIT_REF: "refs/heads/main" });
    expect(r.stage).toBe("production");
  });

  it("branch feat/nueva-feature matchea feat/* → preview", () => {
    const r = getDeployStage({ VERCEL_GIT_COMMIT_REF: "refs/heads/feat/nueva-feature" });
    expect(r.stage).toBe("preview");
  });

  it("branch fix/bug-urgente matchea fix/* → preview", () => {
    const r = getDeployStage({ VERCEL_GIT_COMMIT_REF: "refs/heads/fix/bug-urgente" });
    expect(r.stage).toBe("preview");
  });

  it("branch chore/update-deps matchea chore/* → preview", () => {
    const r = getDeployStage({ VERCEL_GIT_COMMIT_REF: "refs/heads/chore/update-deps" });
    expect(r.stage).toBe("preview");
  });

  it("branch develop matchea → preview", () => {
    const r = getDeployStage({ VERCEL_GIT_COMMIT_REF: "refs/heads/develop" });
    expect(r.stage).toBe("preview");
  });

  it("branch aleatoria no matchea → skip", () => {
    const r = getDeployStage({ VERCEL_GIT_COMMIT_REF: "refs/heads/random-experimento" });
    expect(r.stage).toBe("skip");
    expect(r.reason).toContain("no matchea ALLOWED_BRANCHES");
  });

  it("respeta ALLOWED_BRANCHES custom (solo main → skip feat)", () => {
    const r = getDeployStage({
      VERCEL_GIT_COMMIT_REF: "refs/heads/feat/blocked",
      ALLOWED_BRANCHES: "main",
    });
    expect(r.stage).toBe("skip");
  });

  it("NEXT_PUBLIC_BASE_URL custom se usa en production", () => {
    const r = getDeployStage({
      VERCEL_ENV: "production",
      VERCEL_GIT_COMMIT_REF: "refs/heads/main",
      NEXT_PUBLIC_BASE_URL: "https://custom.example.com",
    });
    expect(r.baseUrl).toBe("https://custom.example.com");
  });
});
