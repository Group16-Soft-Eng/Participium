import { AppDataSource } from "@database";
import { MeasurementDAO } from "@dao/MeasurementDAO";
import { In, Between, MoreThanOrEqual, LessThanOrEqual } from "typeorm";
import { start } from "repl";

export class MeasurementsRepository {
  private repo = AppDataSource.getRepository(MeasurementDAO);

  async storeMeasurements(
    sensorMacAddress: string,
    measurements: { createdAt: Date; value: number; isOutlier?: boolean }[]
  ) {
    const entities = measurements.map((m) =>
      this.repo.create({ ...m, sensorMacAddress })
    );
    return this.repo.save(entities);
  }

  async getMeasurements(
    sensorMacAddress: string,
    startDate?: Date,
    endDate?: Date
  ) {
    let where: any = { sensorMacAddress };
    if (startDate && endDate) {
      where.createdAt = Between(startDate, endDate);
    } else if (startDate) {
      where.createdAt = MoreThanOrEqual(startDate);
    } else if (endDate) {
      where.createdAt = LessThanOrEqual(endDate);
    }
    return this.repo.find({ where, order: { createdAt: "ASC" } });
  }

  async getOutliers(
    sensorMacAddress: string,
    startDate?: Date,
    endDate?: Date
  ) {
    let where: any = { sensorMacAddress, isOutlier: true };
    if (startDate && endDate) {
      where.createdAt = Between(startDate, endDate);
    } else if (startDate) {
      where.createdAt = MoreThanOrEqual(startDate);
    } else if (endDate) {
      where.createdAt = LessThanOrEqual(endDate);
    }
    return this.repo.find({ where, order: { createdAt: "ASC" } });
  }

  async getMeasurementsForSensors(
    sensorMacs: string[],
    startDate?: Date,
    endDate?: Date
  ) {
    let where: any = { sensorMacAddress: In(sensorMacs) };
    if (startDate && endDate) {
      where.createdAt = Between(startDate, endDate);
    } else if (startDate) {
      where.createdAt = MoreThanOrEqual(startDate);
    } else if (endDate) {
      where.createdAt = LessThanOrEqual(endDate);
    }
    return this.repo.find({
      where,
      order: { sensorMacAddress: "ASC", createdAt: "ASC" },
    });
  }

  async getOutliersForSensors(
    sensorMacs: string[],
    startDate?: Date,
    endDate?: Date
  ) {
    let where: any = { sensorMacAddress: In(sensorMacs), isOutlier: true };
    if (startDate && endDate) {
      where.createdAt = Between(startDate, endDate);
    } else if (startDate) {
      where.createdAt = MoreThanOrEqual(startDate);
    } else if (endDate) {
      where.createdAt = LessThanOrEqual(endDate);
    }
    return this.repo.find({
      where,
      order: { sensorMacAddress: "ASC", createdAt: "ASC" },
    });
  }
}
