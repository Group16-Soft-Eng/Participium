import {Router} from "express";
import {uploadReport, getReports, getReportsByOffice } from "@controllers/reportController"
import {ReportFromJSON} from "@dto/Report";

import { authenticateToken, requireUserType } from "@middlewares/authMiddleware"
import { uploadPhotos } from "@middlewares/uploadMiddleware";
import { OfficerRole } from "@models/enums/OfficerRole";
import { ReportRepository } from "@repositories/ReportRepository";
import { NotificationRepository } from "@repositories/NotificationRepository";
import { OfficerRepository } from "@repositories/OfficerRepository";
import { MaintainerRepository } from "@repositories/MaintainerRepository";
import { OfficeType } from "@models/enums/OfficeType";
import { get } from "http";

const router = Router({mergeParams : true});

router.post("/", authenticateToken, requireUserType(["user"]), uploadPhotos, async(req, res, next) =>{
    try{
        // Build DTO from multipart/form-data fields directly to avoid mismatches
        const lat = req.body.latitude ? parseFloat(req.body.latitude as string) : undefined;
        const lng = req.body.longitude ? parseFloat(req.body.longitude as string) : undefined;

        const reportData: any = {
            title: req.body.title || undefined,
            anonymity: req.body.anonymity === '1' || req.body.anonymity === 'true' || req.body.anonymity === true,
            category: req.body.category || undefined,
            document: {
                description: req.body.description || undefined
            },
            location: (lat !== undefined && lng !== undefined) ? { Coordinates: { latitude: lat, longitude: lng } } : undefined
        };

                const files = req.files as Express.Multer.File[];
                const userId = (req as any).user?.id;
                        // debug logging removed: debug file writing was temporary for troubleshooting
                const result = await uploadReport(reportData, files, userId);

        res.status(200).json(result);
    }
    catch(error) {
        next(error);
    }
});

router.get("/",authenticateToken, async(req, res, next) =>{
    try{
        // Check if user is authenticated
        const authHeader = req.headers.authorization;
        let result;
        /*
        if (authHeader && authHeader.startsWith('Bearer ')) {
            // User is authenticated - check if it's an officer
            try {
                const token = authHeader.substring(7);
                const jwt = require('jsonwebtoken');
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
                
                // Check if user type is an officer role
                if (decoded.type && decoded.type !== 'user') {
                    // It's an officer - get their office and filter reports
                    const officerRepo = new OfficerRepository();
                    const officer = await officerRepo.getOfficerById(decoded.id);
                    result = await getReportsByOffice(officer.office);
                } else {
                    // Regular user - show all approved reports
                    result = await getReports();
                }
            } catch (e) {
                // Invalid token - show all approved reports (public)
                result = await getReports();
            }
        } else {
            // No authentication - show all approved reports (public)
            result = await getReports();
        }*/
        result = await getReports();
        res.status(200).json(result);
    }
    catch(error)
    {
        next(error);
    }
});

//? PT-11 (officer manda messaggio all'autore del report [1-way only, guarda su Telegram])
router.post("/:id/message", authenticateToken, requireUserType([OfficerRole.TECHNICAL_OFFICE_STAFF, OfficerRole.MUNICIPAL_ADMINISTRATOR]), async (req, res, next) => {
    try {
        const reportId = Number(req.params.id);
        const text: string = req.body.message;

        if (!text || text.trim().length === 0) {
            return res.status(400).json({ error: "message is required" });
        }

        const reportRepo = new ReportRepository();
        const notificationRepo = new NotificationRepository();

        const report = await reportRepo.getReportById(reportId);
        const officerId = (req as any).user.id;

        const created = await notificationRepo.createOfficerMessageNotification(report as any, officerId, text.trim());

        if (!created) {
            return res.status(200).json({
                info: "No notification created (anonymous report)."
            });
        }

        res.status(201).json({ id: created.id, type: created.type, message: created.message, reportId: created.reportId });
    } catch (err) {
        next(err);
    }
});

export {router as reportRouter};