import { describe, expect, it } from "vitest";
import { fitSize } from "./image";

describe("fitSize", () => {
  it("uzun kenarı sınıra indirir, oranı korur", () => {
    expect(fitSize(4000, 3000, 768)).toEqual({ width: 768, height: 576 });
    expect(fitSize(3000, 4000, 768)).toEqual({ width: 576, height: 768 });
  });
  it("küçük fotoğraf büyütülmez", () => {
    expect(fitSize(500, 300, 768)).toEqual({ width: 500, height: 300 });
  });
});
