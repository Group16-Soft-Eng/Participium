import { Router } from "express";
import { authenticateToken, requireUserType } from "@middlewares/authMiddleware";
import { OfficerRole } from "@models/enums/OfficerRole";
import { OfficeType } from "@models/enums/OfficeType";
import { createMaintainer, getAllMaintainers, getMaintainersByCategory, updateMaintainer, assignReportToMaintainer } from "@controllers/maintainerController";

const router = Router({ mergeParams: true });

//? admin create maintainer
router.post("", authenticateToken, requireUserType([OfficerRole.MUNICIPAL_ADMINISTRATOR]), async (req, res, next) => {
  try {
    const { name, email, password, categories, active } = req.body;
    if (!name || !email || !password || !categories) return res.status(400).json({ error: "name, email, password, categories are required" });
    const result = await createMaintainer(name, email, password, categories as OfficeType[], active ?? true);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

//? admin può accedere alla lista di tutti i maintainers
router.get("/admin", authenticateToken, requireUserType([OfficerRole.MUNICIPAL_ADMINISTRATOR]), async (req, res, next) => {
  try {
    const result = await getAllMaintainers();
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

//? Get maintainers by category
router.get("/by-category/:officeType", authenticateToken, requireUserType([OfficerRole.MUNICIPAL_ADMINISTRATOR, OfficerRole.MUNICIPAL_PUBLIC_RELATIONS_OFFICER]), async (req, res, next) => {
  try {
    const officeType = req.params.officeType as OfficeType;
    if(!officeType){
        return res.status(400).json({error: "officeType query parameter is required"});
    }
    const result = await getMaintainersByCategory(officeType);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

//? come per officer, anche qui ho messo una patch per update maintainer
router.patch("/:id", authenticateToken, requireUserType([OfficerRole.MUNICIPAL_ADMINISTRATOR]), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    // req.body è passato come Partial<MaintainerDAO> nel controller
    const result = await updateMaintainer(id, req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// Assign report to a maintainer (coerente con OfficerRoutes)
router.post("/assign-report", authenticateToken, requireUserType([OfficerRole.MUNICIPAL_ADMINISTRATOR, OfficerRole.MUNICIPAL_PUBLIC_RELATIONS_OFFICER]), async (req, res, next) => {
  try {
    const { reportId, maintainerId } = req.body;
    await assignReportToMaintainer(Number(reportId), Number(maintainerId));
    res.status(200).json({ message: "Report assigned to maintainer" });
  } catch (err) {
    next(err);
  }
});

export { router as maintainerRouter };
