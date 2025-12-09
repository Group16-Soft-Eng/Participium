import { Router } from "express";
import { authenticateToken, requireUserType } from "@middlewares/authMiddleware";
import { listConversation, sendInternalMessage } from "@controllers/internalMessageController";
import { OfficeRole } from "@models/enums/OfficeRole";

const router = Router({ mergeParams: true });

// GET conversazione report
router.get("/report/:reportId", authenticateToken, requireUserType([OfficerRole.TECHNICAL_OFFICE_STAFF, OfficerRole.MAINTAINER]), async (req, res, next) => {
  try {
    const reportId = Number.parseInt(req.params.reportId);
    const list = await listConversation(reportId);
    res.status(200).json(list);
  } catch (err) {
    next(err);
  }
});

// POST nuovo messaggio
router.post("/", authenticateToken, requireUserType([OfficerRole.TECHNICAL_OFFICE_STAFF, OfficerRole.MAINTAINER]), async (req, res, next) => {
  try {
    
    const userTypes: string[] = Array.isArray((req as any).user.type) ? (req as any).user.type : [(req as any).user.type];
    const senderType = userTypes.includes(OfficerRole.MAINTAINER) ? OfficerRole.MAINTAINER : OfficerRole.TECHNICAL_OFFICE_STAFF;
    const senderId = (req as any).user.id;

    const reportId = Number.parseInt(req.body.reportId);
    const message = req.body.message;
    const receiverType = req.body.receiverType as OfficeRole.TECHNICAL_OFFICE_STAFF | OfficeRole.MAINTAINER;
    const receiverId = Number.parseInt(req.body.receiverId);

    const saved = await sendInternalMessage(
        reportId,
        { type: senderType, id: senderId },
        { type: receiverType, id: receiverId },
        message
    );
    res.status(201).json({ message: saved });
  } catch (err) {
    next(err);
  }
});

export { router as internalMessageRouter };