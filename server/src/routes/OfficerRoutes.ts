import {Router} from "express";
import { AppDataSource } from "@database";
import { ReportDAO } from "@dao/ReportDAO";
import {createOfficer,retrieveDocs,reviewDoc, getAllOfficers, updateOfficer, assignReportToOfficer, getAssignedReports} from "@controllers/officerController"
import { authenticateToken, requireUserType } from "@middlewares/authMiddleware"
import {OfficerFromJSON,OfficerToJSON} from "@dto/Officer";
import { OfficerRole } from "@models/enums/OfficerRole";
const router = Router({mergeParams : true});

router.post("", authenticateToken, requireUserType([OfficerRole.MUNICIPAL_ADMINISTRATOR]), async(req, res, next) =>{
    try{
        // debug incoming body and parsed DTO to find undefined fields
        console.log("POST /officers body:", req.body);
        const officerData = OfficerFromJSON(req.body);
        console.log("Parsed officerData:", officerData);
        if(!officerData.email) return res.status(400).json({error: "email is required"});
        const result = await createOfficer(officerData);
        res.status(200).json(result);
    }
    catch(error)
    {
        next(error);
    }
});

router.get("/me", authenticateToken, async (req, res, next) => {
    try {

        res.status(200).json((req as any).user);
    } catch (err) {
        next(err);
    }
});

router.get("/admin",authenticateToken, requireUserType([OfficerRole.MUNICIPAL_ADMINISTRATOR]), async(req, res, next) =>{
    try{
        //role e office possono non esserci
        const alloff = await getAllOfficers();
        const result = alloff.map(OfficerToJSON);
        res.status(200).json(result);
    }
    catch(error)
    {
        next(error);
    }
});

router.patch("/", authenticateToken, requireUserType([OfficerRole.MUNICIPAL_ADMINISTRATOR]), async(req, res, next) =>{
    try{
        //role e office possono non esserci
        const officerData = OfficerFromJSON(req.body);
        const result = await updateOfficer(officerData);
        res.status(200).json(result);
    }
    catch(error)
    {
        next(error);
    }
});

router.post("/assign-report", authenticateToken, requireUserType([OfficerRole.MUNICIPAL_ADMINISTRATOR]), async (req, res, next) => {
    try {
        const { reportId, officerId } = req.body;
        await assignReportToOfficer(reportId, officerId);
        res.status(200).json({ message: "Report assigned successfully" });
    } catch (error) {
        next(error);
    }
});

// Only municipal public relations officers should retrieve PENDING reports for review.
router.get("/retrievedocs", authenticateToken, requireUserType([OfficerRole.MUNICIPAL_PUBLIC_RELATIONS_OFFICER]), async(req, res, next) =>{
    try{
        // Prendi l'ID dell'officer dal token JWT
        const officerId = (req as any).user?.id;
        const result = await retrieveDocs(officerId);
        res.status(200).json(result);
    }
    catch(error)
    {
        next(error);
    }
});

router.get("/assigned", authenticateToken, requireUserType([OfficerRole.TECHNICAL_OFFICE_STAFF]), async (req, res, next) => {
    try {
        const officerId = (req as any).user?.id;
        console.log('[OfficerRoutes] GET /assigned officerId=', officerId);
        const result = await getAssignedReports(officerId);
        console.log('[OfficerRoutes] returning assigned reports count=', Array.isArray(result) ? result.length : 0);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
});

// (Removed: PATCH /officers/assigned/:id — technical officers only need overview per PT08)

router.patch("/reviewdocs/:id", authenticateToken, requireUserType([OfficerRole.TECHNICAL_OFFICE_STAFF, OfficerRole.MUNICIPAL_PUBLIC_RELATIONS_OFFICER]), async(req, res, next) =>{
    try{
        const officerId = (req as any).user?.id;
        console.log('[OfficerRoutes] PATCH /reviewdocs/:id officerId=', officerId, 'id=', req.params.id, 'state=', req.body.state);
        const result = await reviewDoc(officerId, Number(req.params.id), req.body.state, req.body.reason);
        console.log('[OfficerRoutes] review result=', result);

        // Ensure persisted assignedOfficerId is attached (some DTOs/mappers may omit it)
        try {
            const fresh = await AppDataSource.getRepository(ReportDAO).findOne({ where: { id: Number(req.params.id) } });
            if (fresh && (fresh as any).assignedOfficerId != null) {
                (result as any).assignedOfficerId = (fresh as any).assignedOfficerId;
            }
        } catch (e) {
            console.warn('Could not fetch fresh report for assignedOfficerId enrichment', (e as any).message || String(e));
        }

        res.status(200).json(result);
    }
    catch(error)
    {
        next(error);
    }
});

export {router as officerRouter};
