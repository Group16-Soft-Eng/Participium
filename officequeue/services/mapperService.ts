// import DTO
import { Token as TokenDTO } from "@dto/Token";
import { User as UserDTO } from "@dto/User";
import { Network as NetworkDTO } from "@dto/Network";
import { Gateway as GatewayDTO } from "@dto/Gateway";
import { Sensor as SensorDTO } from "@models/dto/Sensor";
import { Measurement as MeasurementDTO } from "@dto/Measurement";
import { ErrorDTO } from "@models/dto/ErrorDTO";

// import DAO
import { UserDAO } from "@models/dao/UserDAO";
import { NetworkDAO } from "@dao/NetworkDAO";
import { GatewayDAO } from "@dao/GatewayDAO";
import { SensorDAO } from "@models/dao/SensorDAO";
import { MeasurementDAO } from "@dao/MeasurementDAO";

import { UserType } from "@models/UserType";

export function createErrorDTO(code: number, message?: string, name?: string): ErrorDTO {
  return removeNullAttributes({code, name, message}) as ErrorDTO;
}

export function createTokenDTO(token: string): TokenDTO {
  return removeNullAttributes({token}) as TokenDTO;
}

export function createUserDTO(username: string, type: UserType, password?: string): UserDTO {
  return removeNullAttributes({username, type, password}) as UserDTO;
}

export function mapUserDAOToDTO(userDAO: UserDAO): UserDTO {
  return createUserDTO(userDAO.username, userDAO.type);
}

export function createNetworkDTO(code: string, name: string, description?: string,
  gateways?: { macAddress: string; name: string }[] ): NetworkDTO {
  return removeNullAttributes({code, name, description, gateways}) as NetworkDTO;
}

export function mapNetworkDTOToDAO(dto: Partial<NetworkDTO>): Partial<NetworkDAO> {
  return {
    code: dto.code,
    name: dto.name,
    description: dto.description
    // gateways NOT mapped here (handled separately)
  };
}

export function mapGatewayDTOToDAO(dto: Partial<GatewayDTO>): Partial<GatewayDAO> {
  return {
    macAddress: dto.macAddress,
    name: dto.name,
    description: dto.description
    // network NOT mapped here (handled separately)
    // sensors NOT mapped here (handled separately)
  };
}

export function mapSensorDTOToDAO(dto: Partial<SensorDTO>): Partial<SensorDAO> {
  return {
    macAddress: dto.macAddress,
    name: dto.name,
    description: dto.description,
    variable: dto.variable,
    unit: dto.unit
    // gateway NOT mapped here (handled separately)
  };
}

export function mapNetworkDAOToDTO(networkDAO: NetworkDAO): NetworkDTO {
  return createNetworkDTO(networkDAO.code, networkDAO.name, networkDAO.description,
    networkDAO.gateways?.map((gateway) => ({
      macAddress: gateway.macAddress,
      name: gateway.name,
      description: gateway.description,
      sensors: gateway.sensors?.map(mapSensorDAOToDTO)
    }))
  );
}

export function createGatewayDTO(macAddress: string, name: string, description?: string, networkCode?: string, sensors?: SensorDTO[]): GatewayDTO {
  return removeNullAttributes({
    macAddress,
    name,
    description,
    networkCode,
    sensors
  }) as GatewayDTO;
}

export function mapGatewayDAOToDTO(gatewayDAO: GatewayDAO): GatewayDTO {
  return createGatewayDTO(
    gatewayDAO.macAddress,
    gatewayDAO.name,
    gatewayDAO?.description,
    gatewayDAO.network?.code,
    gatewayDAO.sensors?.map(mapSensorDAOToDTO)
  );
}

export function createSensorDTO(macAddress: string, name: string, description: string, variable: string, unit: string): SensorDTO {
  return removeNullAttributes({
    macAddress,
    name,
    description,
    variable,
    unit
  }) as SensorDTO;
}

export function mapSensorDAOToDTO(sensorDAO: SensorDAO): SensorDTO {
  return createSensorDTO(
    sensorDAO.macAddress,
    sensorDAO.name,
    sensorDAO.description,
    sensorDAO.variable,
    sensorDAO.unit
  );
}

export function createMeasurementDTO(createdAt: Date, value: number, isOutlier?: boolean): MeasurementDTO {
  return removeNullAttributes({
    createdAt,
    value,
    isOutlier
  }) as MeasurementDTO;
}

export function mapMeasurementDAOToDTO(measurement: MeasurementDAO): MeasurementDTO {
  return createMeasurementDTO(
    measurement.createdAt,
    measurement.value,
    measurement.isOutlier
  );
}

export function removeNullAttributes<T>(dto: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(dto).filter(
      ([_, value]) =>
        value !== null &&
        value !== undefined &&
        (!Array.isArray(value) || value.length > 0)
    )
  ) as Partial<T>;
}
