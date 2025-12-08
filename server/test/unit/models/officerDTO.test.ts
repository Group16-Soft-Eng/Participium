import {
  Officer,
  OfficerFromJSON,
  OfficerFromJSONTyped,
  OfficerToJSON,
  OfficerToJSONTyped,
  instanceOfOfficer
} from "../../../src/models/dto/Officer";
import { OfficerRole } from "../../../src/models/enums/OfficerRole";
import { OfficeType } from "../../../src/models/enums/OfficeType";

describe("Officer DTO", () => {
  const officerObj = {
    id: 1,
    username: "officer1",
    name: "Mario",
    surname: "Rossi",
    email: "mario.rossi@comune.it",
    password: "hashedpassword",
    role: OfficerRole.TECHNICAL_OFFICE_STAFF,
    office: OfficeType.INFRASTRUCTURE
  };

  it("should match Officer interface", () => {
    expect(instanceOfOfficer(officerObj)).toBe(typeof(officerObj) === 'object' && officerObj !== null);
  });

  it("should convert Officer to JSON and back", () => {
    const json = OfficerToJSON(officerObj);
    expect(json).toHaveProperty("id", 1);
    expect(json).toHaveProperty("name", "Mario");
    expect(json).toHaveProperty("Role", OfficerRole.TECHNICAL_OFFICE_STAFF);
    expect(json).toHaveProperty("Office", OfficeType.INFRASTRUCTURE);

    const fromJson = OfficerFromJSON(json);
    expect(fromJson).toMatchObject({
      id: 1,
      name: "Mario",
      role: OfficerRole.TECHNICAL_OFFICE_STAFF,
      office: OfficeType.INFRASTRUCTURE
    });
  });

  it("should handle undefined/null values in OfficerFromJSONTyped", () => {
    expect(OfficerFromJSONTyped(null, false)).toBeNull();
    expect(OfficerFromJSONTyped(undefined, false)).toBeUndefined();
  });

  it("should handle undefined/null values in OfficerToJSONTyped", () => {
    expect(OfficerToJSONTyped(null, false)).toBeNull();
    expect(OfficerToJSONTyped(undefined, false)).toBeUndefined();
  });

  it("should parse Officer from minimal JSON", () => {
    const minimalJson = {
      username: "officer2",
      id: 2,
      name: "Luigi",
      surname: "Bianchi",
      email: "luigi.bianchi@comune.it",
      password: "pw",
      Role: OfficerRole.MUNICIPAL_PUBLIC_RELATIONS_OFFICER,
      Office: OfficeType.ENVIRONMENT
    };
    const parsed = OfficerFromJSON(minimalJson);
    expect(parsed.username).toBe("officer2");
    expect(parsed.role).toBe(OfficerRole.MUNICIPAL_PUBLIC_RELATIONS_OFFICER);
    expect(parsed.office).toBe(OfficeType.ENVIRONMENT);
  });
});