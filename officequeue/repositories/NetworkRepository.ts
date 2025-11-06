import { AppDataSource } from "@database";
import { Repository } from "typeorm";
import { NetworkDAO } from "@dao/NetworkDAO";
import { findOrThrowNotFound, throwConflictIfFound } from "@utils";
import { GatewayRepository } from "./GatewayRepository";

export class NetworkRepository {
  private repo: Repository<NetworkDAO>;

  constructor() {
    this.repo = AppDataSource.getRepository(NetworkDAO);
  }

  getAllNetworks(): Promise<NetworkDAO[]> {
    return this.repo.find({ relations: ["gateways", "gateways.sensors"] });
  }

  async getNetworkByCode(code: string): Promise<NetworkDAO> {
    return findOrThrowNotFound(
      await this.repo.find({
        where: { code },
        relations: ["gateways", "gateways.sensors"],
      }),
      () => true,
      `Network with code '${code}' not found`
    );
  }

  async createNetwork(
    code: string,
    name?: string,
    description?: string
  ): Promise<NetworkDAO> {
    throwConflictIfFound(
      await this.repo.find({ where: { code } }),
      () => true,
      `Network with code '${code}' already exists`
    );

    return this.repo.save({
      code: code,
      name: name,
      description: description,
    });
  }

  async updateNetwork(
    networkCode: string,
    updates: Partial<NetworkDAO>
  ): Promise<NetworkDAO> {
    // find if the network exist,
    const network = await this.getNetworkByCode(networkCode);

    // if there's no new code, use networkCode of the request
    updates.code = updates.code || networkCode;
    // if there's no new name, use the previous one
    updates.name = updates.name || network.name;
    // if there's no new description, use the previous one
    updates.description = updates.description || network.description;

    updates.gateways = network.gateways;

    // if there is a new code for the network
    if (updates.code !== networkCode) {
      // if the new code already exist, throw an error
      throwConflictIfFound(
        await this.repo.find({ where: { code: updates.code } }),
        () => true,
        `Network with code '${updates.code}' already exists`
      );
    }
    Object.assign(network, updates);

    const isCodeChanged = updates.code !== networkCode;

    let gatewaysToUpdate: any[] = [];
    if (isCodeChanged) {
      const gatewayRepo = AppDataSource.getRepository("GatewayDAO");
      gatewaysToUpdate = await gatewayRepo.find({
        where: { network: { code: networkCode } },
        relations: ["network"],
      });
    }

    await this.repo.save(network);
    if (isCodeChanged) {
      if (gatewaysToUpdate.length > 0) {
        const gatewayRepo = AppDataSource.getRepository("GatewayDAO");
        for (const gateway of gatewaysToUpdate) {
          gateway.network = network;
          await gatewayRepo.save(gateway);
        }
      }
      await this.deleteNetwork(networkCode);
    }

    return network;
  }

  async deleteNetwork(code: string): Promise<void> {
    const network = await this.getNetworkByCode(code);
    if (Array.isArray(network.gateways) && network.gateways.length > 0) {
      const gatewayRepo = new GatewayRepository();
      for (const gateway of network.gateways) {
        await gatewayRepo.deleteGateway(code, gateway.macAddress);
      }
    }
    await this.repo.remove(await this.getNetworkByCode(code));
  }
}
