import { test } from "node:test"
import assert from "node:assert/strict"
import resources from "../src/data/resources.json" with { type: "json" }

test("directory has at least 23 resources", () => {
  assert.ok(resources.length >= 23, `expected >= 23 entries, got ${resources.length}`)
})

test("directory includes California resources", () => {
  const california = resources.filter((r) => r.region === "California")
  assert.ok(california.length >= 1, "expected at least one resource with region 'California'")
})

test("every resource has required fields", () => {
  for (const r of resources) {
    for (const field of ["id", "name", "category", "region", "website", "free", "description"]) {
      assert.notEqual(r[field], undefined, `resource ${r.id ?? "?"} missing field "${field}"`)
      assert.notEqual(r[field], null, `resource ${r.id ?? "?"} has null field "${field}"`)
      assert.notEqual(r[field], "", `resource ${r.id ?? "?"} has empty field "${field}"`)
    }
  }
})

test("phone numbers start with a digit or are null", () => {
  for (const r of resources) {
    assert.ok(
      r.phone === null || /^[0-9]/.test(r.phone),
      `resource "${r.id}" has invalid phone: ${JSON.stringify(r.phone)}`,
    )
  }
})

test("no duplicate ids", () => {
  const ids = resources.map((r) => r.id)
  assert.equal(new Set(ids).size, ids.length, "duplicate resource ids found")
})

test("websites use https", () => {
  for (const r of resources) {
    assert.ok(
      r.website.startsWith("https://"),
      `resource "${r.id}" website must start with https://, got ${r.website}`,
    )
  }
})
