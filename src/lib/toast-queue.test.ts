import { describe, expect, it } from "vitest";
import { addToast, MAX_TOASTS, removeToast } from "@/lib/toast-queue";

describe("toast queue", () => {
  it("adds toasts in order", () => {
    const list = addToast(addToast([], { id: 1, message: "a" }), { id: 2, message: "b" });
    expect(list.map((t) => t.id)).toEqual([1, 2]);
  });

  it(`keeps only the newest ${MAX_TOASTS}`, () => {
    let list: ReturnType<typeof addToast> = [];
    for (let id = 1; id <= MAX_TOASTS + 2; id++) list = addToast(list, { id, message: String(id) });
    expect(list.map((t) => t.id)).toEqual([3, 4, 5]);
  });

  it("removes a toast by id", () => {
    const list = [{ id: 1, message: "a" }, { id: 2, message: "b" }];
    expect(removeToast(list, 1)).toEqual([{ id: 2, message: "b" }]);
  });
});
