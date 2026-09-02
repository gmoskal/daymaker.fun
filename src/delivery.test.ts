import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8")

describe("delivery repository", () => {
  it("contains the hackathon submission essentials", () => {
    const readme = read("README.md")
    const license = read("LICENSE")
    const hosting = read("netlify.toml")

    expect(readme).toContain("Why WebMCP")
    expect(readme).toContain("get_mission_state")
    expect(readme).toContain("reorder_mission_stops")
    expect(readme).toContain("Manual browser checks")
    expect(readme).toContain("Deployment: pending")
    expect(readme).toContain("Demo video: pending")
    expect(license).toContain("MIT License")
    expect(hosting).toContain("Content-Security-Policy")
    expect(hosting).toContain("Permissions-Policy")
  })
})
