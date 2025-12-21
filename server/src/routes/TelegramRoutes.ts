import {Router} from "express";
import {uploadReport, getReports, getReportsByOffice, getReport } from "@controllers/reportController"
import {ReportFromJSON} from "@dto/Report";

import { authenticateToken, requireUserType } from "@middlewares/authMiddleware"
import { uploadPhotos } from "@middlewares/uploadMiddleware";
import { OfficerRole } from "@models/enums/OfficerRole";
import { ReportRepository } from "@repositories/ReportRepository";
import { NotificationRepository } from "@repositories/NotificationRepository";
import { OfficerRepository } from "@repositories/OfficerRepository";
import { ReviewStatus } from "@models/enums/ReviewStatus";
import { FollowRepository } from "@repositories/FollowRepository";
import { mapUserDAOToDTO } from "@services/mapperService";


const router = Router({mergeParams : true});


router.post("/report/:reportId/follow",authenticateToken, requireUserType(["user"]),  async (req, res) => {

    const userId = (req as any).user?.id;
    const reportId = Number.parseInt(req.params.reportId);

    const followRepo = new FollowRepository();
    res.status(200).json({ message: "Follow created successfully." });
});

router.delete("/report/:reportId/follow",authenticateToken, requireUserType(["user"]),  async (req, res) => {

    const userId = (req as any).user?.id;
    const reportId = Number.parseInt(req.params.reportId);

    const followRepo = new FollowRepository();
    res.status(200).json({ message: "Follow deleted successfully." });
});


export {router as telegramRouter};