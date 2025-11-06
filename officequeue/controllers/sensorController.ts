import { Sensor as SensorDTO } from "@models/dto/Sensor";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { SensorRepository } from "@repositories/SensorRepository";
import { mapSensorDAOToDTO, mapSensorDTOToDAO } from "@services/mapperService";

export async function getAllSensors(
  networkCode: string,
  gatewayMac: string
): Promise<SensorDTO[]> {
  const gatewayRepo = new GatewayRepository();
  const gateway = await gatewayRepo.getGatewayByMac(networkCode, gatewayMac);
  const sensorRepo = new SensorRepository();
  return (await sensorRepo.getAllSensor(networkCode, gatewayMac)).map(
    mapSensorDAOToDTO
  );
}

export async function getSensor(
  networkCode: string,
  gatewayMac: string,
  sensorMac: string
): Promise<SensorDTO> {
  const gatewayRepo = new GatewayRepository();
  const gateway = await gatewayRepo.getGatewayByMac(networkCode, gatewayMac);
  const sensorRepo = new SensorRepository();
  return mapSensorDAOToDTO(
    await sensorRepo.getSensor(networkCode, gatewayMac, sensorMac)
  );
}

export async function createSensor(
  networkCode: string,
  gatewayMac: string,
  sensorDto: SensorDTO
): Promise<void> {
  const sensorRepo = new SensorRepository();
  const gatewayRepo = new GatewayRepository();

  const gateway = await gatewayRepo.getGatewayByMac(networkCode, gatewayMac);

  await sensorRepo.createSensor(
    gateway,
    sensorDto.macAddress,
    sensorDto.name,
    sensorDto.description,
    sensorDto.variable,
    sensorDto.unit
  );
}
export async function updateSensor(
  networkCode: string,
  gatewayMac: string,
  macAddress: string,
  updatedSensor: Partial<SensorDTO>
): Promise<void> {
  const sensorRepo = new SensorRepository();
  await sensorRepo.updateSensor(
    networkCode,
    gatewayMac,
    macAddress,
    mapSensorDTOToDAO(updatedSensor)
  );
}

export async function deleteSensor(
  networkCode: string,
  gatewayMac: string,
  macAddress: string
) {
  const sensorRepo = new SensorRepository();

  await sensorRepo.deleteSensor(networkCode, gatewayMac, macAddress);
}
