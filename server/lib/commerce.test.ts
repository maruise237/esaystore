import { describe, expect, it } from "vitest";
import { money, paymentMethodFor, sumPaid } from "./commerce";

describe("commerce payment rules", () => {
  it("sums the essential payment methods without accepting negative values", () => {
    expect(sumPaid({ cash: 3_000, mobileMoney: 2_500 })).toBe(5_500);
    expect(sumPaid({ cash: -50, mobileMoney: 800 })).toBe(800);
  });

  it("assigns payment types consistently for cash, mobile, mixed and credit", () => {
    expect(paymentMethodFor(1_000, 0, {})).toBe("credit");
    expect(paymentMethodFor(1_000, 1_000, { cash: 1_000 })).toBe("cash");
    expect(paymentMethodFor(1_000, 1_000, { mobileMoney: 1_000 })).toBe("mobile_money");
    expect(paymentMethodFor(1_000, 600, { cash: 400, mobileMoney: 200 })).toBe("mixed");
  });

  it("keeps financial values to two decimal places", () => {
    expect(money(123.456)).toBe(123.46);
  });
});
