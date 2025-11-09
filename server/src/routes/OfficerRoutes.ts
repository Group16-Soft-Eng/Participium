import {Router} from "express";
import {createOfficer,retrieveDocs,reviewDoc, getAllOfficers} from "@controllers/officerController"
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

router.patch("/", authenticateToken, requireUserType([OfficerRole.MUNICIPAL_ADMINISTRATOR, OfficerRole.MUNICIPAL_PUBLIC_RELATIONS_OFFICER]), async(req, res, next) =>{
    try{
        //role e office possono non esserci
        const officerData = OfficerFromJSON(req.body);
        const result = await createOfficer(officerData);
        res.status(200).json(result);
    }
    catch(error)
    {
        next(error);
    }
});


router.get("/retrievedocs", authenticateToken, requireUserType([OfficerRole.MUNICIPAL_ADMINISTRATOR, OfficerRole.MUNICIPAL_PUBLIC_RELATIONS_OFFICER]), async(req, res, next) =>{
    try{
        //placeholder
        const result = await retrieveDocs(req.body["officerId"]);
        res.status(200).json(result);
    }
    catch(error)
    {
        next(error);
    }
});

router.patch("/reviewdocs/:id", authenticateToken, requireUserType([OfficerRole.MUNICIPAL_ADMINISTRATOR, OfficerRole.MUNICIPAL_PUBLIC_RELATIONS_OFFICER]), async(req, res, next) =>{
    try{
        const result = await reviewDoc(Number(req.params.id), req.body.state, req.body.reason);
        res.status(200).json(result);
    }
    catch(error)
    {
        next(error);
    }
});

export {router as officerRouter};
