/// <reference types="vite/client" />
import { describe, expect, it } from "vitest";
// The gate reads this file; the test reads it too, so a change to one that the other does not
// know about is a red run rather than a silently unpoliced layer.
import raw from "../../../../.fallowrc.json?raw";

// Repo-level guard, not a UI test. It lives in `web` because that is where the layer rules live:
// collapse `.fallowrc.json` back to one zone per package and every assertion below fails, which is
// the exact regression this file exists to catch — see README, "Layers only import leftwards".

interface BoundaryZone {
  readonly name: string;
  readonly patterns?: readonly string[];
}

interface BoundaryRule {
  readonly from: string;
  readonly allow?: readonly string[];
  readonly allowTypeOnly?: readonly string[];
}

interface FallowConfig {
  readonly boundaries: {
    readonly zones?: readonly BoundaryZone[];
    readonly rules?: readonly BoundaryRule[];
    readonly coverage?: { readonly requireAllFiles?: boolean };
  };
}

const config = JSON.parse(raw) as FallowConfig;

const zones = new Map((config.boundaries.zones ?? []).map((zone) => [zone.name, zone]));
const rules = new Map((config.boundaries.rules ?? []).map((rule) => [rule.from, rule]));

// Mirrors fallow's own semantics: a zone with no rule entry is unrestricted, so "the zone still
// exists" is not the same as "the zone still restricts anything".
function isAllowed(from: string, to: string): boolean {
  const rule = rules.get(from);

  if (rule === undefined) {
    return true;
  }

  return (rule.allow ?? []).includes(to) || (rule.allowTypeOnly ?? []).includes(to);
}

// One zone per bucket, in the order conventions/redux.md declares. A package-wide zone satisfies
// none of it.
const WEB_LAYERS = [
  "web-api",
  "web-actions",
  "web-reducers",
  "web-sagas",
  "web-store",
  "web-selectors",
  "web-hooks",
  "web-components",
  "web-entry",
] as const;

const API_LAYERS = ["api-services", "api-routes", "api-app", "api-entry"] as const;
const SHARED_LAYERS = ["shared-types", "shared-schemas", "shared-barrel"] as const;

describe("fallow boundary config", () => {
  it("declares a zone for every layer the conventions name", () => {
    for (const name of [...WEB_LAYERS, ...API_LAYERS, ...SHARED_LAYERS]) {
      expect(zones.has(name), `missing zone: ${name}`).toBe(true);
    }
  });

  it("gives every zone a rule entry, because an unruled zone is unrestricted", () => {
    for (const name of zones.keys()) {
      expect(rules.has(name), `zone without a rule entry: ${name}`).toBe(true);
    }
  });

  it("claims every source file, so a new bucket cannot land unpoliced", () => {
    expect(config.boundaries.coverage?.requireAllFiles).toBe(true);
  });

  it("keeps the UI away from reducers, slice actions and the store", () => {
    // conventions/react.md, conventions/redux.md, README.
    expect(isAllowed("web-components", "web-reducers")).toBe(false);
    expect(isAllowed("web-components", "web-actions")).toBe(false);
    expect(isAllowed("web-components", "web-store")).toBe(false);
    expect(isAllowed("web-components", "web-api")).toBe(false);
    expect(isAllowed("web-hooks", "web-reducers")).toBe(false);
    expect(isAllowed("web-hooks", "web-api")).toBe(false);
  });

  it("keeps sagas before the store and selectors after it", () => {
    // conventions/redux.md: "A saga therefore cannot use a selector".
    expect(isAllowed("web-sagas", "web-selectors")).toBe(false);
    expect(isAllowed("web-sagas", "web-store")).toBe(false);
    expect(isAllowed("web-reducers", "web-store")).toBe(false);
    expect(isAllowed("web-selectors", "web-store")).toBe(true);
  });

  it("forbids importing rightwards, not only the documented exceptions", () => {
    // conventions/core.md: "A layer may import only from layers to its left."
    for (const [index, from] of WEB_LAYERS.entries()) {
      for (const to of WEB_LAYERS.slice(index + 1)) {
        expect(isAllowed(from, to), `${from} may import ${to}`).toBe(false);
      }
    }

    for (const [index, from] of API_LAYERS.entries()) {
      for (const to of API_LAYERS.slice(index + 1)) {
        expect(isAllowed(from, to), `${from} may import ${to}`).toBe(false);
      }
    }
  });

  it("keeps the three packages apart", () => {
    // conventions/project.md: "api and web never import each other."
    for (const from of WEB_LAYERS) {
      for (const to of API_LAYERS) {
        expect(isAllowed(from, to), `${from} may import ${to}`).toBe(false);
      }
    }

    for (const from of API_LAYERS) {
      for (const to of WEB_LAYERS) {
        expect(isAllowed(from, to), `${from} may import ${to}`).toBe(false);
      }
    }
  });

  it("lets shared be imported by both apps and import nothing itself", () => {
    // conventions/project.md: "Both may import shared; shared imports nothing."
    for (const name of SHARED_LAYERS) {
      const allowed = rules.get(name)?.allow ?? [];

      expect(allowed.filter((target) => !target.startsWith("shared-"))).toEqual([]);
    }

    expect(isAllowed("web-components", "shared-barrel")).toBe(true);
    expect(isAllowed("api-routes", "shared-barrel")).toBe(true);
  });

  it("keeps tests inside their own package", () => {
    // A test zone that allows every zone would be a way around every rule above.
    expect(isAllowed("web-test", "api-entry")).toBe(false);
    expect(isAllowed("api-test", "web-store")).toBe(false);
    expect(isAllowed("shared-test", "web-store")).toBe(false);
    expect(isAllowed("web-test", "web-reducers")).toBe(true);
  });
});
