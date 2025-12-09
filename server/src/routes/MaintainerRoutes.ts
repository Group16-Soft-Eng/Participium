import { Router } from "express";
import { authenticateToken, requireUserType } from "@middlewares/authMiddleware";
import { OfficerRole } from "@models/enums/OfficerRole";
import { OfficeType } from "@models/enums/OfficeType";
import { createMaintainer, getAllMaintainers, getMaintainersByCategory, updateMaintainer, deleteMaintainer, updateReportStatusByMaintainer, getAssignedReportsForMaintainer } from "@controllers/maintainerController";

const router = Router({ mergeParams: true });

//? PT-25: maintainer update report status (come per l'officer, ma per il maintainer)

router.get("/list", authenticateToken, requireUserType([OfficerRole.MUNICIPAL_ADMINISTRATOR, OfficerRole.MUNICIPAL_PUBLIC_RELATIONS_OFFICER, OfficerRole.TECHNICAL_OFFICE_STAFF]),  async (req, res, next) => {
  try {
    const result = await getAllMaintainers();
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

//? Get maintainers by category
router.get("/by-category/:officeType", authenticateToken, requireUserType([OfficerRole.MUNICIPAL_ADMINISTRATOR, OfficerRole.MUNICIPAL_PUBLIC_RELATIONS_OFFICER, OfficerRole.TECHNICAL_OFFICE_STAFF]), async (req, res, next) => {
  try {
    const officeType = req.params.officeType as OfficeType;
    if (!officeType) {
      return res.status(400).json({ error: "officeType query parameter is required" });
    }
    const result = await getMaintainersByCategory(officeType);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

router.get("/assigned", authenticateToken, requireUserType([OfficerRole.MAINTAINER]), async (req, res, next) => {
  try {
    const maintainerId = (req as any).user?.id;
    if (!maintainerId) return res.status(401).json({ error: "Unauthorized" });
    
    const result = await getAssignedReportsForMaintainer(maintainerId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

router.patch("/reports/:id/status", authenticateToken, requireUserType([OfficerRole.MAINTAINER]), async (req, res, next) => {
  try {
    const reportId = Number(req.params.id);
    const maintainerId = (req as any).user?.id;
    const { state, reason } = req.body;

    if (!maintainerId) return res.status(401).json({ error: "Unauthorized" });
    if (!state) return res.status(400).json({ error: "state is required" });

    const updated = await updateReportStatusByMaintainer(maintainerId, reportId, state, reason);
    
    res.status(200).json({
      id: updated.id,
      state: updated.state
    });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", authenticateToken, requireUserType([OfficerRole.MUNICIPAL_ADMINISTRATOR]), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "id is required" });
    await deleteMaintainer(id);
    res.status(200).json({ message: `Maintainer with id '${id}' deleted successfully` });
  } catch (err) {
    next(err);
  }
});

export { router as maintainerRouter };
