import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8")

describe("delivery repository", () => {
  it("contains the hackathon submission essentials", () => {
    const readme = read("README.md")
    const license = read("LICENSE")
    const hosting = read("netlify.toml")
    const vercel = read("vercel.json")

    expect(readme).toContain("Why WebMCP")
    expect(readme).toContain("get_mission_state")
    expect(readme).toContain("reorder_mission_stops")
    expect(readme).toContain("Manual browser checks")
    expect(readme).toContain(
      "Production URL: [daymaker.fun](https://daymaker.fun)",
    )
    expect(readme).not.toContain("Deployment: pending")
    expect(readme).toContain(
      "Demo video: [YouTube](https://www.youtube.com/watch?v=XlG632xwWvs)",
    )
    expect(license).toContain("MIT License")
    expect(hosting).toContain("Content-Security-Policy")
    expect(hosting).toContain("https://www.youtube-nocookie.com")
    expect(hosting).toContain("Permissions-Policy")
    expect(vercel).toContain('"framework": "vite"')
    expect(vercel).toContain('"outputDirectory": "dist"')
    expect(vercel).toContain('"rewrites"')
    expect(vercel).toContain('"key": "Content-Security-Policy"')
    expect(vercel).toContain("https://www.youtube.com")
    expect(vercel).toContain("https://www.youtube-nocookie.com")
    expect(vercel).toContain('"key": "Permissions-Policy"')
  })
})
