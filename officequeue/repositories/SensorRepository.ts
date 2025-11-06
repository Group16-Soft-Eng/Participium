import { AppDataSource } from "@database";
import { Repository } from "typeorm";
import { GatewayDAO } from "@dao/GatewayDAO";
import { SensorDAO } from "@dao/SensorDAO";
import { findOrThrowNotFound, throwConflictIfFound } from "@utils";
import { MeasurementDAO } from "@models/dao/MeasurementDAO";
//import { NetworkRepository } from "./NetworkRepository";

export class SensorRepository {
  private repo: Repository<SensorDAO>;

  constructor() {
    this.repo = AppDataSource.getRepository(SensorDAO);
  }

  async getAllSensor(
    networkCode: string,
    gatewayMac: string
  ): Promise<SensorDAO[]> {
    const sensors = await this.repo.find({
      where: {
        gateway: {
          macAddress: gatewayMac,
          network: {
            code: networkCode,
          },
        },
      },
      relations: {
        gateway: { network: true },
      },
    });
    return sensors;
  }

  async getSensor(
    networkCode: string,
    gatewayMac: string,
    sensorMac: string
  ): Promise<SensorDAO> {
    return findOrThrowNotFound(
      await this.repo.find({
        where: {
          macAddress: sensorMac,
          gateway: {
            macAddress: gatewayMac,
            network: {
              code: networkCode,
            },
          },
        },
        relations: {
          gateway: { network: true },
        },
      }),
      () => true,
      `Sensor with Mac Address '${sensorMac}' not found`
    );
  }

  async getSensorMacsByNetworkCode(networkCode: string): Promise<string[]> {
    const sensors = await this.repo.find({
      where: {
        gateway: {
          network: {
            code: networkCode,
          },
        },
      },
      relations: {
        gateway: { network: true },
      },
      select: {
        macAddress: true,
      },
    });
    return sensors.map((sensor) => sensor.macAddress);
  }

  /*async getSensorMacsByNetworkCode(networkCode: string): Promise<string[]> {
    const networkRepo = new NetworkRepository();
    const network = await networkRepo.getNetworkByCode(networkCode);

    const sensors = await this.repo.find({
      where: {
        gateway: {
          network: {
            code: networkCode,
          },
        },
      },
      relations: {
        gateway: { network: true },
      },
      select: {
        macAddress: true,
      },
    });
    return sensors.map((sensor) => sensor.macAddress);
  }*/

  async createSensor(
    gateway: GatewayDAO,
    macAddress: string,
    name: string,
    description: string,
    variable: string,
    unit: string
  ): Promise<SensorDAO> {
    throwConflictIfFound(
      await this.repo.find({
        where: {
          macAddress: macAddress,
        },
      }),
      () => true,
      `Sensor with MAC '${macAddress}' already exists`
    );

    return this.repo.save({
      macAddress,
      name,
      description,
      variable,
      unit,
      gateway,
    });
  }

  async updateSensor(
    networkCode: string,
    gatewayMac: string,
    macAddress: string,
    updates: Partial<SensorDAO>
  ): Promise<SensorDAO> {
    const sensor = await this.getSensor(networkCode, gatewayMac, macAddress);

    updates.macAddress = updates.macAddress || macAddress;
    updates.gateway = sensor.gateway;

    // Always preserve original values if not provided in updates
    updates.name = updates.name ?? sensor.name;
    updates.description = updates.description ?? sensor.description;
    updates.variable = updates.variable ?? sensor.variable;
    updates.unit = updates.unit ?? sensor.unit;

    if (updates.macAddress !== macAddress) {
      throwConflictIfFound(
        await this.repo.find({ where: { macAddress: updates.macAddress } }),
        () => true,
        "Sensor Mac address already in use"
      );
    }

    Object.assign(sensor, updates);

    const isMacAddressChanged = updates.macAddress !== macAddress;

    let measurementsToUpdate: any[] = [];
    if (isMacAddressChanged) {
      const measurementsRepo = AppDataSource.getRepository(MeasurementDAO);
      measurementsToUpdate = await measurementsRepo.find({
        where: {
          sensorMacAddress: macAddress,
        },
      });
    }

    await this.repo.save(sensor);

    if (isMacAddressChanged) {
      if (measurementsToUpdate.length > 0) {
        const measurementsRepo = AppDataSource.getRepository(MeasurementDAO);
        for (const measurement of measurementsToUpdate) {
          measurement.sensorMacAddress = updates.macAddress;
          await measurementsRepo.save(measurement);
        }
      }
      await this.deleteSensor(networkCode, gatewayMac, macAddress);
    }

    return sensor;
  }

  async deleteSensor(
    networkCode: string,
    gatewayMac: string,
    macAddress: string
  ): Promise<void> {
    const sensor = await this.getSensor(networkCode, gatewayMac, macAddress);

    const measurementsRepo = AppDataSource.getRepository(MeasurementDAO);
    const measurementsToDelete = await measurementsRepo.find({
      where: {
        sensorMacAddress: sensor.macAddress,
      },
    });
    for (const measurement of measurementsToDelete) {
      await measurementsRepo.delete(measurement);
    }

    await this.repo.remove(
      await this.getSensor(networkCode, gatewayMac, macAddress)
    );
  }
}
