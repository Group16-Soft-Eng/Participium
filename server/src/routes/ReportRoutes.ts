import {Router} from "express";
import {uploadReport, getReports, getReportsByOffice } from "@controllers/reportController"
import {ReportFromJSON} from "@dto/Report";

import { authenticateToken, requireUserType } from "@middlewares/authMiddleware"
import { uploadPhotos } from "@middlewares/uploadMiddleware";
import { OfficerRole } from "@models/enums/OfficerRole";
import { OfficerRepository } from "@repositories/OfficerRepository";

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

router.get("/", async(req, res, next) =>{
    try{
        // Check if user is authenticated
        const authHeader = req.headers.authorization;
        let result;
        
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
        }
        
        res.status(200).json(result);
    }
    catch(error)
    {
        next(error);
    }
});

export {router as reportRouter};