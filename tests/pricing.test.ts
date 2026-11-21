import { describe, test } from "node:test";
import assert from "node:assert";
import {
  estimateTokenCost,
  isUsablePrice,
  parseTokenCount,
  TOKENS_PER_PRICE_UNIT,
  MAX_ESTIMATE_TOKENS,
  type TokenUsage,
} from "@/lib/pricing";

describe("isUsablePrice", () => {
  test("accepts zero and positive finite numbers", () => {
    assert.strictEqual(isUsablePrice(0), true);
    assert.strictEqual(isUsablePrice(0.01), true);
    assert.strictEqual(isUsablePrice(1.25), true);
    assert.strictEqual(isUsablePrice(10000), true);
  });

  test("rejects null and undefined", () => {
    assert.strictEqual(isUsablePrice(null), false);
    assert.strictEqual(isUsablePrice(undefined), false);
  });

  test("rejects negative numbers", () => {
    assert.strictEqual(isUsablePrice(-1), false);
    assert.strictEqual(isUsablePrice(-0.01), false);
  });

  test("rejects NaN and Infinity", () => {
    assert.strictEqual(isUsablePrice(NaN), false);
    assert.strictEqual(isUsablePrice(Infinity), false);
    assert.strictEqual(isUsablePrice(-Infinity), false);
  });
});

describe("parseTokenCount", () => {
  test("accepts plain whole numbers", () => {
    const result = parseTokenCount("1000000", "input");
    assert.strictEqual(result.success, true);
    if (result.success) assert.strictEqual(result.value, 1_000_000);
  });

  test("accepts thousands separators", () => {
    const result = parseTokenCount("1,000,000", "input");
    assert.strictEqual(result.success, true);
    if (result.success) assert.strictEqual(result.value, 1_000_000);
  });

  test("accepts whitespace-padded input", () => {
    const result = parseTokenCount("  500,000  ", "output");
    assert.strictEqual(result.success, true);
    if (result.success) assert.strictEqual(result.value, 500_000);
  });

  test("accepts zero", () => {
    const result = parseTokenCount("0", "input");
    assert.strictEqual(result.success, true);
    if (result.success) assert.strictEqual(result.value, 0);
  });

  test("rejects blank input", () => {
    const result = parseTokenCount("", "input");
    assert.strictEqual(result.success, false);
    if (!result.success)
      assert.strictEqual(
        result.message,
        "Enter an estimated input token count.",
      );
  });

  test("rejects whitespace-only input", () => {
    const result = parseTokenCount("   ", "input");
    assert.strictEqual(result.success, false);
  });

  test("rejects decimals", () => {
    const result = parseTokenCount("1.5", "input");
    assert.strictEqual(result.success, false);
    if (!result.success)
      assert.strictEqual(
        result.message,
        "Use a whole number of tokens with digits only (no decimals or signs).",
      );
  });

  test("rejects negative signs", () => {
    const result = parseTokenCount("-1", "input");
    assert.strictEqual(result.success, false);
  });

  test("rejects exponents", () => {
    const result = parseTokenCount("1e5", "input");
    assert.strictEqual(result.success, false);
  });

  test("rejects non-numeric text", () => {
    const result = parseTokenCount("abc", "input");
    assert.strictEqual(result.success, false);
  });

  test("rejects mixed alphanumeric", () => {
    const result = parseTokenCount("100tokens", "input");
    assert.strictEqual(result.success, false);
  });

  test("rejects values above the maximum", () => {
    const result = parseTokenCount(
      String(MAX_ESTIMATE_TOKENS + 1),
      "input",
    );
    assert.strictEqual(result.success, false);
    if (!result.success)
      assert.strictEqual(
        result.message,
        "Enter 1,000,000,000,000 tokens or fewer.",
      );
  });

  test("accepts the maximum allowed value", () => {
    const result = parseTokenCount(
      String(MAX_ESTIMATE_TOKENS),
      "input",
    );
    assert.strictEqual(result.success, true);
    if (result.success) assert.strictEqual(result.value, MAX_ESTIMATE_TOKENS);
  });

  test("uses the label in the blank-error message", () => {
    const result = parseTokenCount("", "output");
    assert.strictEqual(result.success, false);
    if (!result.success)
      assert.strictEqual(
        result.message,
        "Enter an estimated output token count.",
      );
  });
});

describe("estimateTokenCost", () => {
  const usage: TokenUsage = { inputTokens: 1_000_000, outputTokens: 500_000 };

  test("calculates input + output cost correctly", () => {
    const result = estimateTokenCost(usage, 1.25, 10);
    assert.strictEqual(result?.inputCost, 1.25);
    assert.strictEqual(result?.outputCost, 5.0);
    assert.strictEqual(result?.totalCost, 6.25);
  });

  test("returns null when input price is null", () => {
    assert.strictEqual(estimateTokenCost(usage, null, 10), null);
  });

  test("returns null when output price is null", () => {
    assert.strictEqual(estimateTokenCost(usage, 1.25, null), null);
  });

  test("returns null when either price is undefined", () => {
    assert.strictEqual(estimateTokenCost(usage, undefined, 10), null);
    assert.strictEqual(estimateTokenCost(usage, 1.25, undefined), null);
  });

  test("returns null when either price is negative", () => {
    assert.strictEqual(estimateTokenCost(usage, -1, 10), null);
    assert.strictEqual(estimateTokenCost(usage, 1.25, -10), null);
  });

  test("returns null when either price is NaN or Infinity", () => {
    assert.strictEqual(estimateTokenCost(usage, NaN, 10), null);
    assert.strictEqual(estimateTokenCost(usage, 1.25, Infinity), null);
  });

  test("accepts a zero output price (embedding models)", () => {
    const result = estimateTokenCost(
      { inputTokens: 1_000_000, outputTokens: 0 },
      0.13,
      0,
    );
    assert.strictEqual(result?.inputCost, 0.13);
    assert.strictEqual(result?.outputCost, 0);
    assert.strictEqual(result?.totalCost, 0.13);
  });

  test("returns zero costs when token counts are zero", () => {
    const result = estimateTokenCost(
      { inputTokens: 0, outputTokens: 0 },
      1.25,
      10,
    );
    assert.strictEqual(result?.inputCost, 0);
    assert.strictEqual(result?.outputCost, 0);
    assert.strictEqual(result?.totalCost, 0);
  });

  test("returns null for negative input tokens", () => {
    assert.strictEqual(
      estimateTokenCost({ inputTokens: -1, outputTokens: 0 }, 1.25, 10),
      null,
    );
  });

  test("returns null for negative output tokens", () => {
    assert.strictEqual(
      estimateTokenCost({ inputTokens: 0, outputTokens: -1 }, 1.25, 10),
      null,
    );
  });

  test("returns null for non-finite token counts", () => {
    assert.strictEqual(
      estimateTokenCost(
        { inputTokens: NaN, outputTokens: 0 },
        1.25,
        10,
      ),
      null,
    );
    assert.strictEqual(
      estimateTokenCost(
        { inputTokens: 0, outputTokens: Infinity },
        1.25,
        10,
      ),
      null,
    );
  });

  test("handles very small prices with full precision", () => {
    const result = estimateTokenCost(
      { inputTokens: 1, outputTokens: 1 },
      0.00125,
      0.01,
    );
    assert.ok(result !== null);
    if (result) {
      assert.strictEqual(result.inputCost, 0.00000125);
      assert.strictEqual(result.outputCost, 0.00000001);
      assert.strictEqual(result.totalCost, 0.00000126);
    }
  });

  test("uses the documented price unit of 1,000,000 tokens", () => {
    assert.strictEqual(TOKENS_PER_PRICE_UNIT, 1_000_000);
    const result = estimateTokenCost(
      { inputTokens: 2_000_000, outputTokens: 0 },
      5,
      0,
    );
    assert.strictEqual(result?.inputCost, 10);
  });

  test("MAX_ESTIMATE_TOKENS is one trillion", () => {
    assert.strictEqual(MAX_ESTIMATE_TOKENS, 1_000_000_000_000);
  });
});
