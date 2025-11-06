import { AppDataSource } from "@database";
import { Repository } from "typeorm";
import { GatewayDAO } from "@dao/GatewayDAO";
import { NetworkDAO } from "@dao/NetworkDAO";
import { findOrThrowNotFound, throwConflictIfFound } from "@utils";
import { MeasurementDAO } from "@models/dao/MeasurementDAO";

export class GatewayRepository {
  private repo: Repository<GatewayDAO>;

  constructor() {
    this.repo = AppDataSource.getRepository(GatewayDAO);
  }

  async getAllGateways(networkCode: string): Promise<GatewayDAO[]> {
    const networkRepo = AppDataSource.getRepository(NetworkDAO);
    let network;
    if (typeof networkRepo.findOne === "function") {
      network = await networkRepo.findOne({ where: { code: networkCode } });
    } else {
      const found = await networkRepo.find({ where: { code: networkCode } });
      network = found && found.length > 0 ? found[0] : undefined;
    }
    if (!network) {
      throw new (require("@models/errors/NotFoundError").NotFoundError)(
        `Network with code '${networkCode}' not found`
      );
    }
    return this.repo.find({
      where: { network: { code: networkCode } },
      relations: ["network", "sensors"],
    });
  }

  async getGatewayByMac(
    networkCode: string,
    macAddress: string
  ): Promise<GatewayDAO> {
    return findOrThrowNotFound(
      await this.repo.find({
        where: { macAddress, network: { code: networkCode } },
        relations: ["network", "sensors"],
      }),
      () => true,
      `Gateway with MAC '${macAddress}' not found in network '${networkCode}'`
    );
  }

  async createGateway(
    network: NetworkDAO,
    macAddress: string,
    name: string,
    description?: string
  ): Promise<GatewayDAO> {
    throwConflictIfFound(
      await this.repo.find({ where: { macAddress } }),
      () => true,
      `Gateway with MAC '${macAddress}' already exists`
    );

    return this.repo.save({
      macAddress,
      name,
      description,
      network,
    });
  }

  async updateGateway(
    networkCode: string,
    macAddress: string,
    updates: Partial<GatewayDAO>
  ): Promise<GatewayDAO> {
    // find if the network exists, and then find if the gateway is in Network
    const gateway = await this.getGatewayByMac(networkCode, macAddress);

    // if there's no new mac address, use mac address of the request
    updates.macAddress = updates.macAddress || macAddress;
    updates.description = updates.description || gateway.description;
    updates.name = updates.name || gateway.name;

    updates.network = gateway.network;
    updates.sensors = gateway.sensors;

    if (updates.macAddress !== macAddress) {
      throwConflictIfFound(
        await this.repo.find({ where: { macAddress: updates.macAddress } }),
        () => true,
        "Gateway mac address already in use"
      );
    }

    Object.assign(gateway, updates);

    const isMacAddressChanged = updates.macAddress !== macAddress;

    let sensorsToUpdate: any[] = [];
    if (isMacAddressChanged) {
      const sensorRepo = AppDataSource.getRepository("SensorDAO");
      sensorsToUpdate = await sensorRepo.find({
        where: { gateway: { macAddress: macAddress } },
        relations: ["gateway"],
      });
    }
    await this.repo.save(gateway);

    if (isMacAddressChanged) {
      if (sensorsToUpdate.length > 0) {
        const sensorRepo = AppDataSource.getRepository("SensorDAO");
        for (const sensor of sensorsToUpdate) {
          sensor.gateway = gateway;
          await sensorRepo.save(sensor);
        }
      }
      await this.deleteGateway(networkCode, macAddress);
    }
    return gateway;
  }

  async deleteGateway(networkCode: string, macAddress: string): Promise<void> {
    const gateway = await this.getGatewayByMac(networkCode, macAddress);
    if (Array.isArray(gateway.sensors) && gateway.sensors.length > 0) {
      const measurementsRepo = AppDataSource.getRepository(MeasurementDAO);
      for (const sensor of gateway.sensors) {
        await measurementsRepo.delete({ sensorMacAddress: sensor.macAddress });
      }
    }
    await this.repo.remove(await this.getGatewayByMac(networkCode, macAddress));
  }
}
