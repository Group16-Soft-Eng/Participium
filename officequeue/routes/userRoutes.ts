import { Router } from "express";
import { authenticateUser } from "@middlewares/authMiddleware";
import { UserType } from "@models/UserType";
import {
  createUser,
  deleteUser,
  getAllUsers,
  getUser
} from "@controllers/userController";
import { UserFromJSON } from "@dto/User";

const router = Router();

router.get("", authenticateUser([UserType.Admin]), async (req, res, next) => {
  try {
    res.status(200).json(await getAllUsers());
  } catch (error) {
    next(error);
  }
});

router.post(
  "",
  authenticateUser([UserType.Admin]),
  async (req, res, next) => {
    try {
      await createUser(UserFromJSON(req.body));
      res.status(201).send();
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/:userName",
  authenticateUser([UserType.Admin]),
  async (req, res, next) => {
    try {
      res.status(200).json(await getUser(req.params.userName));
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/:userName",
  authenticateUser([UserType.Admin]),
  async (req, res, next) => {
    try {
      await deleteUser(req.params.userName);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;