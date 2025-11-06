import { Router } from "express";
import { authenticateUser } from "@middlewares/authMiddleware";
import { UserType } from "@models/UserType";
import { getAllNetworks, getNetwork, createNetwork, updateNetwork, deleteNetwork } from "@controllers/networkController";
import { NetworkFromJSON } from "@dto/Network";

const router = Router();

router.get(
  "",
  authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]),
  async (req, res, next) => {
    try {
      res.status(200).json(await getAllNetworks());
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
      await createNetwork(NetworkFromJSON(req.body));
      res.status(201).send();
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/:networkCode",
  authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]),
  async (req, res, next) => {
    try {
      res.status(200).json(await getNetwork(req.params.networkCode));
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  "/:networkCode",
  authenticateUser([UserType.Admin, UserType.Operator]),
  async (req, res, next) => {
    try {
      await updateNetwork(req.params.networkCode, req.body);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/:networkCode",
  authenticateUser([UserType.Admin, UserType.Operator]),
  async (req, res, next) => {
    try {
      await deleteNetwork(req.params.networkCode);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;