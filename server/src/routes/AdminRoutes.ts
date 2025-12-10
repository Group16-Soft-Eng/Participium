import { Router } from "express";
import {
  createOfficer,
  getAllOfficers,
  updateOfficer,
  addRoleToOfficer,
  removeRoleFromOfficer,
  deleteOfficer
} from "@controllers/officerController";
import { authenticateToken, requireUserType } from "@middlewares/authMiddleware";
import { OfficerFromJSON, OfficerToJSON } from "@dto/Officer";
import { OfficerRole } from "@models/enums/OfficerRole";
import { OfficeType } from "@models/enums/OfficeType";
import { createMaintainer, getAllMaintainers, getMaintainersByCategory, updateMaintainer, assignReportToMaintainer, updateReportStatusByMaintainer } from "@controllers/maintainerController";

const router = Router({ mergeParams: true });

router.post("", authenticateToken, requireUserType([OfficerRole.MUNICIPAL_ADMINISTRATOR]), async (req, res, next) => {
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

router.get("/admin", authenticateToken, requireUserType([OfficerRole.MUNICIPAL_ADMINISTRATOR]), async (req, res, next) => {
  try {
    const alloff = await getAllOfficers();
    res.status(200).json(alloff.map(OfficerToJSON));
  } catch (error) {
    next(error);
  }
}
);

router.patch("/", authenticateToken, requireUserType([OfficerRole.MUNICIPAL_ADMINISTRATOR]), async (req, res, next) => {
  try {
    const officerData = OfficerFromJSON(req.body);
    const result = await updateOfficer(officerData);
    res.status(200).json(OfficerToJSON(result));
  } catch (error) {
    next(error);
  }
}
);

router.patch("/role/add", authenticateToken, requireUserType([OfficerRole.MUNICIPAL_ADMINISTRATOR]), async (req, res, next) => {
  try {
    const { officerId, role, officeType } = req.body;
    if (!officerId || !role || !officeType) {
      return res.status(400).json({ error: "officerId, role and officeType are required" });
    }
    const result = await addRoleToOfficer(officerId, role as OfficerRole, officeType as OfficeType);
    res.status(200).json(OfficerToJSON(result));
  } catch (error) {
    next(error);
  }
}
);

router.patch("/role/remove", authenticateToken, requireUserType([OfficerRole.MUNICIPAL_ADMINISTRATOR]), async (req, res, next) => {
  try {
    const { officerId, role, officeType } = req.body;
    if (!officerId || !role || !officeType) {
      return res.status(400).json({ error: "officerId, role and officeType are required" });
    }
    const result = await removeRoleFromOfficer(officerId, role as OfficerRole, officeType as OfficeType);
    res.status(200).json(OfficerToJSON(result));
  } catch (error) {
    next(error);
  }
}
);
router.delete("/officers/:id", authenticateToken, requireUserType([OfficerRole.MUNICIPAL_ADMINISTRATOR]), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "id is required" });
    await deleteOfficer(id);
    res.status(200).json({ message: `Officer with id '${id}' deleted successfully` });
  } catch (error) {
    next(error);
  }
}
);

//Maintainer management 


//? admin create maintainer
router.post("/maintainers", authenticateToken, requireUserType([OfficerRole.MUNICIPAL_ADMINISTRATOR]), async (req, res, next) => {
  try {
    const { name, email, password, categories, active } = req.body;
    if (!name || !email || !password || !categories) return res.status(400).json({ error: "name, email, password, categories are required" });
    const result = await createMaintainer(name, email, password, categories as OfficeType[], active ?? true);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});
//? come per officer, anche qui ho messo una patch per update maintainer
router.patch("/maintainers/:id", authenticateToken, requireUserType([OfficerRole.MUNICIPAL_ADMINISTRATOR]), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    // req.body è passato come Partial<MaintainerDAO> nel controller
    const result = await updateMaintainer(id, req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

export { router as AdminRouter };
