import { Gateway as GatewayDTO } from "@dto/Gateway";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { NetworkRepository } from "@repositories/NetworkRepository";
import {
  mapGatewayDAOToDTO,
  mapGatewayDTOToDAO,
} from "@services/mapperService";

export async function getAllGateways(
  networkCode: string
): Promise<GatewayDTO[]> {
  const gatewayRepo = new GatewayRepository();
  return (await gatewayRepo.getAllGateways(networkCode)).map(
    mapGatewayDAOToDTO
  );
}

export async function getGateway(
  networkCode: string,
  macAddress: string
): Promise<GatewayDTO> {
  const gatewayRepo = new GatewayRepository();
  return mapGatewayDAOToDTO(
    await gatewayRepo.getGatewayByMac(networkCode, macAddress)
  );
}

export async function createGateway(
  gatewayDto: GatewayDTO,
  networkCode: string
): Promise<void> {
  const gatewayRepo = new GatewayRepository();
  const networkRepo = new NetworkRepository();
  const network = await networkRepo.getNetworkByCode(networkCode);

  await gatewayRepo.createGateway(
    network,
    gatewayDto.macAddress,
    gatewayDto.name,
    gatewayDto.description
  );
}

export async function updateGateway(
  networkCode: string,
  macAddress: string,
  updates: Partial<GatewayDTO>
): Promise<void> {
  const gatewayRepo = new GatewayRepository();
  await gatewayRepo.updateGateway(
    networkCode,
    macAddress,
    mapGatewayDTOToDAO(updates)
  );
}

export async function deleteGateway(
  networkCode: string,
  macAddress: string
): Promise<void> {
  const gatewayRepo = new GatewayRepository();
  await gatewayRepo.deleteGateway(networkCode, macAddress);
}
