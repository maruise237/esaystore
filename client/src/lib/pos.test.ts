import { describe, expect, it } from "vitest";
import { amountStillDue, canConfirmSale, excessPayment, requiresCustomerForSale, suggestedCashAmounts } from "./pos";

describe("raccourcis de caisse", () => {
  it("calculates the amount that still needs to be paid", () => {
    expect(amountStillDue(2500, 1000, 800)).toBe(700);
    expect(amountStillDue(2500, 3000, 0)).toBe(0);
  });

  it("suggests practical cash amounts rounded to 500", () => {
    expect(suggestedCashAmounts(1240)).toEqual([500, 1000, 1240]);
  });

  it("requires a customer only when a balance remains", () => {
    expect(requiresCustomerForSale(1000, 1000, 0)).toBe(false);
    expect(requiresCustomerForSale(1000, 500, 0)).toBe(true);
  });

  it("blocks a payment that would exceed the total", () => {
    expect(excessPayment(1000, 700, 500)).toBe(200);
    expect(excessPayment(1000, 700, 300)).toBe(0);
  });

  it("allows credit with a customer while blocking it without one", () => {
    expect(canConfirmSale({ itemCount: 1, total: 1000, cash: 500, mobileMoney: 0 })).toBe(false);
    expect(canConfirmSale({ itemCount: 1, total: 1000, cash: 500, mobileMoney: 0, customerId: "customer-1" })).toBe(true);
    expect(canConfirmSale({ itemCount: 1, total: 1000, cash: 1200, mobileMoney: 0, customerId: "customer-1" })).toBe(false);
  });
});
