import { OfficeType } from "../../../src/models/enums/OfficeType";

describe("OfficeType Enum", () => {
  it("should contain all expected office types", () => {
    expect(OfficeType.INFRASTRUCTURE).toBe("infrastructure");
    expect(OfficeType.ENVIRONMENT).toBe("environment");
    expect(OfficeType.SAFETY).toBe("safety");
    expect(OfficeType.SANITATION).toBe("sanitation");
    expect(OfficeType.TRANSPORT).toBe("transport");
    expect(OfficeType.ORGANIZATION).toBe("organization");
    expect(OfficeType.OTHER).toBe("other");
  });

  it("should have 7 values", () => {
    expect(Object.keys(OfficeType)).toHaveLength(7);
  });

  it("should allow usage as type", () => {
    const office: OfficeType = OfficeType.SAFETY;
    expect(office).toBe("safety");
  });

  it("should not allow invalid values", () => {
    // @ts-expect-error
    const invalid: OfficeType = "invalid";
    expect(invalid).toBe("invalid");
  });
});