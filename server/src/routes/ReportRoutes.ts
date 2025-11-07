import {Router} from "express";
import {uploadReport,getReports } from "@controllers/reportController"
import {ReportFromJSON} from "@dto/Report";
const router = Router({mergeParams : true});

router.post("/", async(req, res, next) =>{
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

router.get("/", async(req, res, next) =>{
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