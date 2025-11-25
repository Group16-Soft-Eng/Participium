/* Auto-bridge file: re-export DTO types from src and provide simple JSON (de)serializers
   This file is a small compatibility shim so the generated api code can be compiled
   in the backend build. It intentionally implements trivial FromJSON/ToJSON helpers.
*/

export * from '../../src/models/dto';

// Aliases for generated names that may differ from our DTOs
// If the generated client expects LoginUserRequest1, alias it to LoginUserRequest
import type { LoginUserRequest } from '../../src/models/dto/LoginUserRequest';
export type LoginUserRequest1 = LoginUserRequest;

// Trivial (de)serializers used by generated code. They pass-through JS objects.
export function LoginUserRequestFromJSON(json: any): LoginUserRequest {
  return json as LoginUserRequest;
}
export function LoginUserRequestToJSON(value?: LoginUserRequest | null): any {
  return value as any;
}
export function LoginUserRequest1FromJSON(json: any): LoginUserRequest1 {
  return json as LoginUserRequest1;
}
export function LoginUserRequest1ToJSON(value?: LoginUserRequest1 | null): any {
  return value as any;
}

// Generate simple To/From for the main models used by generated apis
// List: User, Officer, Report, ReportDocument, Location, LocationCoordinates, ModelApiResponse, ModelError
export function UserFromJSON(json: any) { return json; }
export function UserToJSON(value: any) { return value; }
export function OfficerFromJSON(json: any) { return json; }
export function OfficerToJSON(value: any) { return value; }
export function ReportFromJSON(json: any) { return json; }
export function ReportToJSON(value: any) { return value; }
export function ReportDocumentFromJSON(json: any) { return json; }
export function ReportDocumentToJSON(value: any) { return value; }
export function LocationFromJSON(json: any) { return json; }
export function LocationToJSON(value: any) { return value; }
export function LocationCoordinatesFromJSON(json: any) { return json; }
export function LocationCoordinatesToJSON(value: any) { return value; }
export function ModelApiResponseFromJSON(json: any) { return json; }
export function ModelApiResponseToJSON(value: any) { return value; }
export function ModelErrorFromJSON(json: any) { return json; }
export function ModelErrorToJSON(value: any) { return value; }
export function ReportStateFromJSON(json: any) { return json; }
export function ReportStateToJSON(value: any) { return value; }
export function OfficerRoleFromJSON(json: any) { return json; }
export function OfficerRoleToJSON(value: any) { return value; }
export function OfficeTypeFromJSON(json: any) { return json; }
export function OfficeTypeToJSON(value: any) { return value; }
export function StateFromJSON(json: any) { return json; }
export function StateToJSON(value: any) { return value; }
