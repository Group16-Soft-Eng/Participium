import {Router} from "express";
import {createOfficer,retrieveDocs,reviewDoc, getAllOfficers, updateOfficer, assignReportToOfficer, getAllAssignedReportsOfficer, getAllOfficersByOfficeType} from "@controllers/officerController"
import { authenticateToken, requireUserType } from "@middlewares/authMiddleware"
import {OfficerFromJSON,OfficerToJSON} from "@dto/Officer";
import { OfficerRole } from "@models/enums/OfficerRole";
const router = Router({mergeParams : true});


//? added also for story 8 (look at getAllAssignedReportsOfficer)
router.get("/assigned", authenticateToken, requireUserType([OfficerRole.TECHNICAL_OFFICE_STAFF, OfficerRole.MUNICIPAL_PUBLIC_RELATIONS_OFFICER]), async (req, res, next) => {
    try {
        const officerId = (req as any).user?.id;
        const result = await getAllAssignedReportsOfficer(officerId);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
});
router.get("/OfficerByOfficeType/:officeType", authenticateToken, requireUserType([OfficerRole.MUNICIPAL_ADMINISTRATOR, OfficerRole.MUNICIPAL_PUBLIC_RELATIONS_OFFICER]), async(req, res, next) =>{
    try{
        const officeType = req.params.officeType as string;
        if(!officeType){
            return res.status(400).json({error: "officeType query parameter is required"});
        }
        const alloff = await getAllOfficersByOfficeType(officeType);
        const result = alloff.map(OfficerToJSON);
        res.status(200).json(result);
    }
    catch(error)
    {
        next(error);
    }
});




router.patch("/reviewdocs/:id", authenticateToken, requireUserType([OfficerRole.TECHNICAL_OFFICE_STAFF, OfficerRole.MUNICIPAL_PUBLIC_RELATIONS_OFFICER]), async(req, res, next) =>{
    try{
        const officerId = (req as any).user?.id;
        const{state,reason} = req.body;
        const result = await reviewDoc(officerId, Number(req.params.id), state, reason);
        res.status(200).json(result);
    }
    catch(error)
    {
        next(error);
    }
});

export {router as officerRouter};
