import { Network as NetworkDTO } from "@dto/Network";
import { NetworkRepository } from "@repositories/NetworkRepository";
import { mapNetworkDAOToDTO, mapNetworkDTOToDAO } from "@services/mapperService";

export async function getAllNetworks(): Promise<NetworkDTO[]> {
  const networkRepo = new NetworkRepository();
  return (await networkRepo.getAllNetworks()).map(mapNetworkDAOToDTO);
}

export async function getNetwork(code: string): Promise<NetworkDTO> {
  const networkRepo = new NetworkRepository();
  return mapNetworkDAOToDTO(await networkRepo.getNetworkByCode(code));
}

export async function createNetwork(networkDto: NetworkDTO): Promise<void> {
  const networkRepo = new NetworkRepository();
  await networkRepo.createNetwork(networkDto.code, networkDto.name, networkDto.description);
}

export async function updateNetwork(code: string, updates: Partial<NetworkDTO>): Promise<void> {
  const networkRepo = new NetworkRepository();
  await networkRepo.updateNetwork(code, mapNetworkDTOToDAO(updates));
}

export async function deleteNetwork(code: string): Promise<void> {
  const networkRepo = new NetworkRepository();
  await networkRepo.deleteNetwork(code);
}