import { describe, it, expect } from "vitest";
import type { AxiosResponse } from "axios";
import { decodeEntities, paginate } from "@/lib/api/parsers";

function makeRes<T>(data: T, headers: Record<string, string> = {}): AxiosResponse<T> {
  return {
    data,
    status: 200,
    statusText: "OK",
    headers,
    config: {} as never,
  };
}

describe("decodeEntities()", () => {
  it("decodes named and decimal numeric entities from WooCommerce", () => {
    expect(decodeEntities("A &#038; B")).toBe("A & B");
    expect(decodeEntities("Preorder &#8211; 50%")).toBe("Preorder – 50%");
    expect(decodeEntities("Sorry, coupon &quot;onetime&quot; is not applicable.")).toBe(
      'Sorry, coupon "onetime" is not applicable.',
    );
    expect(decodeEntities("maximum spend is &#036;39.99.")).toBe("maximum spend is $39.99.");
  });
});

describe("paginate()", () => {
  it("handles a plain array response", () => {
    const items = [{ id: 1 }, { id: 2 }];
    const result = paginate(makeRes(items));
    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
  });

  it("reads items/total/totalPages from envelope shape", () => {
    const envelope = { items: [{ id: 1 }], total: 50, totalPages: 5, page: 2, per_page: 10 };
    const result = paginate(makeRes(envelope), 2, 10);
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(50);
    expect(result.totalPages).toBe(5);
    expect(result.page).toBe(2);
    expect(result.perPage).toBe(10);
  });

  it("falls back to x-wp-total header when envelope has no total", () => {
    const data = { items: [{ id: 1 }] };
    const result = paginate(makeRes(data, { "x-wp-total": "100", "x-wp-totalpages": "10" }));
    expect(result.total).toBe(100);
    expect(result.totalPages).toBe(10);
  });
});
