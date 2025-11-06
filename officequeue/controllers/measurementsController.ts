import { MeasurementsRepository } from "@repositories/MeasurementsRepository";
import { SensorRepository } from "@repositories/SensorRepository";
import { mapMeasurementDAOToDTO } from "@services/mapperService";
import { Measurements } from "@dto/Measurements";
import { Stats } from "@dto/Stats";
import { NotFoundError } from "@models/errors/NotFoundError";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { NetworkRepository } from "@repositories/NetworkRepository";

function calculateStatsAndFlagOutliers(
  measurements: {
    createdAt: Date;
    value: number;
    isOutlier?: boolean;
    sensorMacAddress?: string;
    // id?: number;
  }[]
) {
  // if (!measurements.length) return { stats: undefined, flagged: [] };
  const values = measurements.map((m) => m.value);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const upperThreshold = mean + 2 * stdDev;
  const lowerThreshold = mean - 2 * stdDev;
  const flagged = measurements.map((m) => ({
    ...m,
    isOutlier: m.value > upperThreshold || m.value < lowerThreshold,
  }));

  return {
    stats: {
      startDate: measurements[0].createdAt,
      endDate: measurements[measurements.length - 1].createdAt,
      mean,
      variance,
      upperThreshold,
      lowerThreshold,
    },
    flagged,
  };
}

function calculateStatsAndFlagOutliersWithId(
  startDate: Date,
  endDate: Date,
  measurements: {
    id: number;
    createdAt: Date;
    value: number;
    isOutlier?: boolean;
    sensorMacAddress?: string;
  }[]
) {
  if (!measurements.length)
    return {
      stats: {
        startDate: startDate,
        endDate: endDate,
        mean: 0,
        variance: 0,
        upperThreshold: 0,
        lowerThreshold: 0,
      },
      flagged: [],
    };
  const values = measurements.map((m) => m.value);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const upperThreshold = mean + 2 * stdDev;
  const lowerThreshold = mean - 2 * stdDev;
  const flagged = measurements.map((m) => ({
    ...m,
    isOutlier: m.value > upperThreshold || m.value < lowerThreshold,
  }));

  return {
    stats: {
      startDate: startDate,
      endDate: endDate,
      // startDate: measurements[0].createdAt,
      // endDate: measurements[measurements.length - 1].createdAt,
      mean,
      variance,
      upperThreshold,
      lowerThreshold,
    },
    flagged,
  };
}

export async function storeMeasurements(
  networkCode: string,
  gatewayMac: string,
  sensorMacAddress: string,
  measurements: {
    // id: number;
    createdAt: Date;
    value: number;
    isOutlier?: boolean;
  }[]
) {
  // const networkrepo = new NetworkRepository();
  // const network = await networkrepo.getNetworkByCode(networkCode);
  // const gatewayRepo = new GatewayRepository();
  // const gateway = await gatewayRepo.getGatewayByMac(networkCode, gatewayMac);
  const sensorRepo = new SensorRepository();
  const sensor = await sensorRepo.getSensor(
    networkCode,
    gatewayMac,
    sensorMacAddress
  );
  const { flagged } = calculateStatsAndFlagOutliers(measurements);
  const repo = new MeasurementsRepository();
  await repo.storeMeasurements(sensorMacAddress, flagged);
}

export async function getMeasurements(
  networkCode: string,
  gatewayMac: string,
  sensorMacAddress: string,
  startDate?: Date,
  endDate?: Date
): Promise<Measurements> {
  const sensorRepo = new SensorRepository();
  const sensor = await sensorRepo.getSensor(
    networkCode,
    gatewayMac,
    sensorMacAddress
  );

  const repo = new MeasurementsRepository();
  const measurements = await repo.getMeasurements(
    sensorMacAddress,
    startDate,
    endDate
  );
  // if (!measurements.length)
  //   throw new (require("@models/errors/NotFoundError").NotFoundError)(
  //     "Sensor not found or no measurements"
  //   );
  const { stats, flagged } = calculateStatsAndFlagOutliersWithId(
    startDate,
    endDate,
    measurements
  );
  return {
    sensorMacAddress,
    stats,
    measurements: flagged.map((m) =>
      mapMeasurementDAOToDTO({ ...m, sensorMacAddress })
    ),
  };
}

export async function getStats(
  networkCode: string,
  gatewayMac: string,
  sensorMacAddress: string,
  startDate?: Date,
  endDate?: Date
): Promise<Stats | undefined> {
  const sensorRepo = new SensorRepository();
  const sensor = await sensorRepo.getSensor(
    networkCode,
    gatewayMac,
    sensorMacAddress
  );
  const repo = new MeasurementsRepository();
  const measurements = await repo.getMeasurements(
    sensorMacAddress,
    startDate,
    endDate
  );
  const { stats } = calculateStatsAndFlagOutliersWithId(
    startDate,
    endDate,
    measurements
  );
  return stats;
}

export async function getOutliers(
  networkCode: string,
  gatewayMac: string,
  sensorMacAddress: string,
  startDate?: Date,
  endDate?: Date
): Promise<Measurements> {
  const sensorRepo = new SensorRepository();
  const sensor = await sensorRepo.getSensor(
    networkCode,
    gatewayMac,
    sensorMacAddress
  );
  const repo = new MeasurementsRepository();
  const measurements = await repo.getMeasurements(
    sensorMacAddress,
    startDate,
    endDate
  );
  const { stats, flagged } = calculateStatsAndFlagOutliersWithId(
    startDate,
    endDate,
    measurements
  );
  const onlyOutliers = flagged.filter((m) => m.isOutlier);
  return {
    sensorMacAddress,
    stats,
    measurements: onlyOutliers.map((m) =>
      mapMeasurementDAOToDTO({ ...m, sensorMacAddress })
    ),
  };
}

export async function getMeasurementsForSensors(
  sensorMacs: string[],
  startDate?: Date,
  endDate?: Date
): Promise<Measurements[]> {
  const repo = new MeasurementsRepository();
  const all = await repo.getMeasurementsForSensors(
    sensorMacs,
    startDate,
    endDate
  );
  return sensorMacs.map((mac) => {
    const measurements = all.filter((m) => m.sensorMacAddress === mac);
    const { stats, flagged } = calculateStatsAndFlagOutliersWithId(
      startDate,
      endDate,
      measurements
    );
    return {
      sensorMacAddress: mac,
      stats,
      measurements: flagged.map((m) =>
        mapMeasurementDAOToDTO({ ...m, sensorMacAddress: mac })
      ),
    };
  });
}

export async function getOutliersForSensors(
  sensorMacs: string[],
  startDate?: Date,
  endDate?: Date
): Promise<Measurements[]> {
  const repo = new MeasurementsRepository();
  const all = await repo.getMeasurementsForSensors(
    sensorMacs,
    startDate,
    endDate
  );
  const results = sensorMacs.map((mac) => {
    const measurements = all.filter((m) => m.sensorMacAddress === mac);
    const { stats, flagged } = calculateStatsAndFlagOutliersWithId(
      startDate,
      endDate,
      measurements
    );
    const onlyOutliers = flagged.filter((m) => m.isOutlier);

    const result = {
      sensorMacAddress: mac,
      stats,
      measurements: onlyOutliers.map((m) =>
        mapMeasurementDAOToDTO({ ...m, sensorMacAddress: mac })
      ),
    };
    return result;
  });

  return results;
}

/*export async function getMeasurementsForNetwork(networkCode: string, sensorMacs?: string[], startDate?: Date, endDate?: Date): Promise<Measurements[]> {
  let macs = sensorMacs;
  if (!macs || macs.length === 0) {
    const sensorsRepo = new SensorRepository();
    macs = await sensorsRepo.getSensorMacsByNetworkCode(networkCode);
    if (!macs.length) throw new NotFoundError("Sensor specified not belongs to network");
  }
  return getMeasurementsForSensors(macs, startDate, endDate);
}*/

// Retrieve measurements but if there aren't sensors, empty array (if newer tests want 500 error, use other version)
export async function getMeasurementsForNetwork(
  networkCode: string,
  sensorMacs?: string[],
  startDate?: Date,
  endDate?: Date
): Promise<Measurements[]> {
  const isArrayIsContained = (queryMacs: string[], dbMacs: string[]) => {
    return queryMacs.every((mac) => dbMacs.includes(mac));
  };
  const intersection = (queryMacs: string[], dbMacs: string[]) => {
    return dbMacs.filter((mac) => queryMacs.includes(mac));
  };
  const networkRepo = new NetworkRepository();
  const network = await networkRepo.getNetworkByCode(networkCode);

  const sensorRepo = new SensorRepository();

  const sensors = await sensorRepo.getSensorMacsByNetworkCode(networkCode);

  !sensorMacs || sensorMacs.length == 0
    ? (sensorMacs = sensors)
    : (sensorMacs = Array.from(new Set(sensorMacs)));

  sensorMacs = intersection(sensorMacs, sensors);

  if (!isArrayIsContained(sensorMacs, sensors) || sensorMacs.length === 0) {
    // throw new NotFoundError("Sensor specified not belongs to network");
    return Promise.resolve([]);
  }
  return getMeasurementsForSensors(sensorMacs, startDate, endDate);
}

export async function getOutliersForNetwork(
  networkCode: string,
  sensorMacs?: string[],
  startDate?: Date,
  endDate?: Date
): Promise<Measurements[]> {
  const networkRepo = new NetworkRepository();
  const network = await networkRepo.getNetworkByCode(networkCode);

  let macs = sensorMacs;
  if (!macs || macs.length === 0) {
    const sensorsRepo = new SensorRepository();
    macs = await sensorsRepo.getSensorMacsByNetworkCode(networkCode);
    if (!macs.length)
      // throw new NotFoundError("Sensor specified not belongs to network");
      return Promise.resolve([]);
  }
  return getOutliersForSensors(macs, startDate, endDate);
}

export async function getStatsForNetwork(
  networkCode: string,
  sensorMacs?: string[],
  startDate?: Date,
  endDate?: Date
): Promise<{ sensorMacAddress: string; stats: Stats | undefined }[]> {
  const networkRepo = new NetworkRepository();
  const network = await networkRepo.getNetworkByCode(networkCode);

  let macs = sensorMacs;
  
  if (!macs) {
    const sensorsRepo = new SensorRepository();
    macs = await sensorsRepo.getSensorMacsByNetworkCode(networkCode);
    if (!macs.length)
      // throw new NotFoundError("Sensor specified not belongs to network");
      return Promise.resolve([]);
  }
  const measurements = await getMeasurementsForSensors(
    macs,
    startDate,
    endDate
  );
  return measurements.map((m) => ({
    sensorMacAddress: m.sensorMacAddress,
    stats: m.stats,
  }));
}
