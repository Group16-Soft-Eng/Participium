import {Router} from "express";
import {uploadReport,getReports } from "@controllers/reportController"
import {ReportFromJSON} from "@dto/Report";

import { authenticateToken, requireUserType } from "@middlewares/authMiddleware"
import { OfficerRole } from "@models/enums/OfficerRole";
const router = Router({mergeParams : true});

router.post("/", authenticateToken, requireUserType(["user"]), async(req, res, next) =>{
    try{
        const reportData = ReportFromJSON(req.body);
        const result = await uploadReport(reportData);
        res.status(200).json(result);
    }
    catch(error)
    {
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