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
        const reportData = ReportFromJSON(req.body);

        const files = req.files as Express.Multer.File[]; // uploaded files
        const userId = (req as any).user?.id;
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