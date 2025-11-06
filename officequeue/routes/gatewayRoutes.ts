import { Router } from "express";
import { authenticateUser } from "@middlewares/authMiddleware";
import { UserType } from "@models/UserType";
import { getAllGateways, getGateway, createGateway, updateGateway, deleteGateway } from "@controllers/gatewayController";
import { GatewayFromJSON } from "@dto/Gateway";

const router = Router({ mergeParams: true });

router.get(
  "",
  authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]),
  async (req, res, next) => {
    try {
      const networkCode = req.params.networkCode;
      const gateways = await getAllGateways(networkCode);
      res.status(200).json(gateways);
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
      const networkCode = req.params.networkCode;
      const gatewayDto = GatewayFromJSON(req.body);
      await createGateway(gatewayDto, networkCode);
      res.status(201).send();
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/:gatewayMac",
  authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]),
  async (req, res, next) => {
    try {
      const networkCode = req.params.networkCode;
      const gatewayMac = req.params.gatewayMac;
      const gateway = await getGateway(networkCode, gatewayMac);
      res.status(200).json(gateway);
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  "/:gatewayMac",
  authenticateUser([UserType.Admin, UserType.Operator]),
  async (req, res, next) => {
    try {
      const networkCode = req.params.networkCode;
      const gatewayMac = req.params.gatewayMac;
      const updates = req.body;
      await updateGateway(networkCode, gatewayMac, updates);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/:gatewayMac",
  authenticateUser([UserType.Admin, UserType.Operator]),
  async (req, res, next) => {
    try {
      const networkCode = req.params.networkCode;
      const gatewayMac = req.params.gatewayMac;
      await deleteGateway(networkCode, gatewayMac);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;