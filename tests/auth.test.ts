import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { safeNext } from "@/lib/auth/redirect";

describe("post-login redirects", () => {
  it("allows same-site paths only", () => {
    assert.equal(safeNext("/saved"), "/saved");
    assert.equal(safeNext("/used-cars?make=ford"), "/used-cars?make=ford");
    for (const bad of ["https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)", "", null, "/x\r\nSet-Cookie: a"]) {
      assert.equal(safeNext(bad), "/account", String(bad));
    }
  });
});
