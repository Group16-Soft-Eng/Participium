import {Router} from "express";
import {uploadReport,getReports } from "@controllers/reportController"
import {ReportFromJSON} from "@dto/Report";

import { authenticateToken, requireUserType } from "@middlewares/authMiddleware"
import { uploadPhotos } from "@middlewares/uploadMiddleware";
import { OfficerRole } from "@models/enums/OfficerRole";

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

router.get("/", authenticateToken, async(req, res, next) =>{
    try{
        const result = await getReports();
        res.status(200).json(result);
    }
    catch(error)
    {
        next(error);
    }
});

export {router as reportRouter};