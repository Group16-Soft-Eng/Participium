import { Router } from "express";
import {
  storeMeasurements,
  getMeasurements,
  getStats,
  getOutliers,
  getMeasurementsForNetwork,
  getOutliersForNetwork,
  getStatsForNetwork,
} from "@controllers/measurementsController";
import { authenticateUser } from "@middlewares/authMiddleware";
import { UserType } from "@models/UserType";
import { parseISODateParamToUTC, parseStringArrayParam } from "@utils";

const router = Router();

router.post(
  "/api/v1/networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/measurements",
  authenticateUser([UserType.Admin, UserType.Operator]),
  async (req, res, next) => {
    try {
      const { networkCode, gatewayMac, sensorMac } = req.params;
      await storeMeasurements(networkCode, gatewayMac, sensorMac, req.body);
      res.status(201).end();
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/api/v1/networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/measurements",
  authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]),
  async (req, res, next) => {
    try {
      const { networkCode, gatewayMac, sensorMac } = req.params;

      const startDate = parseISODateParamToUTC(req.query.startDate);
      const endDate = parseISODateParamToUTC(req.query.endDate);

      const result = await getMeasurements(
        networkCode,
        gatewayMac,
        sensorMac,
        startDate,
        endDate
      );
      if (result && Array.isArray(result.measurements)) {
        result.measurements = result.measurements.map((m) => ({
          ...m,
          isOutlier: m.isOutlier !== undefined ? m.isOutlier : false,
        }));
      }
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/api/v1/networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/stats",
  authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]),
  async (req, res, next) => {
    try {
      const { networkCode, gatewayMac, sensorMac } = req.params;
      const startDate = parseISODateParamToUTC(req.query.startDate);
      const endDate = parseISODateParamToUTC(req.query.endDate);
      const result = await getStats(
        networkCode,
        gatewayMac,
        sensorMac,
        startDate,
        endDate
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/api/v1/networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/outliers",
  authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]),
  async (req, res, next) => {
    try {
      const { networkCode, gatewayMac, sensorMac } = req.params;
      const startDate = parseISODateParamToUTC(req.query.startDate);
      const endDate = parseISODateParamToUTC(req.query.endDate);
      const result = await getOutliers(
        networkCode,
        gatewayMac,
        sensorMac,
        startDate,
        endDate
      );
      if (result && Array.isArray(result.measurements)) {
        result.measurements = result.measurements.map((m) => ({
          ...m,
          isOutlier: m.isOutlier !== undefined ? m.isOutlier : false,
        }));
      }
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/api/v1/networks/:networkCode/measurements",
  authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]),
  async (req, res, next) => {
    try {
      const { networkCode } = req.params;
      const sensorMacs = parseStringArrayParam(req.query.sensorMacs);
      const startDate = parseISODateParamToUTC(req.query.startDate);
      const endDate = parseISODateParamToUTC(req.query.endDate);
      const result = await getMeasurementsForNetwork(
        networkCode,
        sensorMacs,
        startDate,
        endDate
      );
      if (Array.isArray(result)) {
        result.forEach((measurementsObj) => {
          if (Array.isArray(measurementsObj.measurements)) {
            measurementsObj.measurements = measurementsObj.measurements.map(
              (m) => ({
                ...m,
                isOutlier: m.isOutlier !== undefined ? m.isOutlier : false,
              })
            );
          }
        });
      }
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/api/v1/networks/:networkCode/stats",
  authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]),
  async (req, res, next) => {
    try {
      const { networkCode } = req.params;
      const sensorMacs = parseStringArrayParam(req.query.sensorMacs);
      const startDate = parseISODateParamToUTC(req.query.startDate);
      const endDate = parseISODateParamToUTC(req.query.endDate);
      const result = await getStatsForNetwork(
        networkCode,
        sensorMacs,
        startDate,
        endDate
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/api/v1/networks/:networkCode/outliers",
  authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]),
  async (req, res, next) => {
    try {
      const { networkCode } = req.params;
      const sensorMacs = parseStringArrayParam(req.query.sensorMacs);
      const startDate = parseISODateParamToUTC(req.query.startDate);
      const endDate = parseISODateParamToUTC(req.query.endDate);
      const result = await getOutliersForNetwork(
        networkCode,
        sensorMacs,
        startDate,
        endDate
      );
      if (Array.isArray(result)) {
        result.forEach((measurementsObj) => {
          if (Array.isArray(measurementsObj.measurements)) {
            measurementsObj.measurements = measurementsObj.measurements.map(
              (m) => ({
                ...m,
                isOutlier: m.isOutlier !== undefined ? m.isOutlier : false,
              })
            );
          }
        });
      }
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
