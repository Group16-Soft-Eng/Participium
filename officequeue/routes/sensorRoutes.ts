import { Router } from "express";
import { authenticateUser } from "@middlewares/authMiddleware";
import { UserType } from "@models/UserType";
import { getAllSensors, getSensor, createSensor, updateSensor, deleteSensor } from "@controllers/sensorController";
import { SensorFromJSON } from "@models/dto/Sensor";

const router = Router({ mergeParams: true });

router.get(
  "",
  authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]),
  async (req, res, next) => {
    try {
      res
        .status(200)
        .json(
          await getAllSensors(req.params.networkCode, req.params.gatewayMac)
        );
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "",
  authenticateUser([UserType.Admin, UserType.Operator]),
  async (req, res, next) => {
    try {
      await createSensor(
        req.params.networkCode,
        req.params.gatewayMac,
        SensorFromJSON(req.body)
      );
      res.status(201).send();
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/:sensorMac",
  authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]),
  async (req, res, next) => {
    try {
      res
        .status(200)
        .json(
          await getSensor(
            req.params.networkCode,
            req.params.gatewayMac,
            req.params.sensorMac
          )
        );
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  "/:sensorMac",
  authenticateUser([UserType.Admin, UserType.Operator]),
  async (req, res, next) => {
    try {
      await updateSensor(
        req.params.networkCode,
        req.params.gatewayMac,
        req.params.sensorMac,
        req.body
      );
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/:sensorMac",
  authenticateUser([UserType.Admin, UserType.Operator]),
  async (req, res, next) => {
    try {
      await deleteSensor(
        req.params.networkCode,
        req.params.gatewayMac,
        req.params.sensorMac
      );
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;