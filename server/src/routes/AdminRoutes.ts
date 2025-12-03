import { Router } from "express";
import {
  createOfficer,
  getAllOfficers,
  updateOfficer,
  addRoleToOfficer,
  removeRoleFromOfficer,
} from "@controllers/officerController";
import { authenticateToken, requireUserType } from "@middlewares/authMiddleware";
import { OfficerFromJSON, OfficerToJSON } from "@dto/Officer";
import { OfficerRole } from "@models/enums/OfficerRole";
import { OfficeType } from "@models/enums/OfficeType";

const router = Router({ mergeParams: true });

router.post(
  "",
  authenticateToken,
  requireUserType([OfficerRole.MUNICIPAL_ADMINISTRATOR]),
  async (req, res, next) => {
    try {
      const officerData = OfficerFromJSON(req.body);
      if (!officerData.email) return res.status(400).json({ error: "email is required" });
      const result = await createOfficer(officerData);
      res.status(200).json(OfficerToJSON(result));
    } catch (error) {
      next(error);
    }
  }
);

router.get(  "/admin",  authenticateToken,  requireUserType([OfficerRole.MUNICIPAL_ADMINISTRATOR]),  async (req, res, next) => {
    try {
      const alloff = await getAllOfficers();
      res.status(200).json(alloff.map(OfficerToJSON));
    } catch (error) {
      next(error);
    }
  }
);

router.patch(  "/",  authenticateToken,  requireUserType([OfficerRole.MUNICIPAL_ADMINISTRATOR]),  async (req, res, next) => {
    try {
      const officerData = OfficerFromJSON(req.body);
      const result = await updateOfficer(officerData);
      res.status(200).json(OfficerToJSON(result));
    } catch (error) {
      next(error);
    }
  }
);

router.post(  "/role",  authenticateToken,  requireUserType([OfficerRole.MUNICIPAL_ADMINISTRATOR]),  async (req, res, next) => {
    try {
      const { officerId, role, office } = req.body;
      if (!officerId || !role || !office)
        return res.status(400).json({ error: "officerId, role and office are required" });

      const result = await addRoleToOfficer(
        Number(officerId),
        role as OfficerRole,
        office as OfficeType
      );
      res.status(200).json(OfficerToJSON(result));
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/role",
  authenticateToken,
  requireUserType([OfficerRole.MUNICIPAL_ADMINISTRATOR]),
  async (req, res, next) => {
    try {
      const { officerId, role, office } = req.body;
      if (!officerId || !role || !office)
        return res.status(400).json({ error: "officerId, role and office are required" });

      const result = await removeRoleFromOfficer(
        Number(officerId),
        role as OfficerRole,
        office as OfficeType
      );
      res.status(200).json(OfficerToJSON(result));
    } catch (error) {
      next(error);
    }
  }
);

export { router as officerRouter };
