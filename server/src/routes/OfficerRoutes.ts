import {Router} from "express";
import {createOfficer,retrieveDocs,reviewDoc} from "@controllers/officerController"
import { authenticateToken, requireUserType } from "@middlewares/authMiddleware"
import { Officer,  OfficerFromJSON} from "@dto/Officer";
const router = Router({mergeParams : true});

router.post("",authenticateToken, requireUserType("admin"), async(req, res, next) =>{
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

router.patch("/", authenticateToken, requireUserType(["admin","officer"]), async(req, res, next) =>{
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


router.get("/retrievedocs", authenticateToken, requireUserType(["admin","officer"]), async(req, res, next) =>{
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

router.patch("/reviewdocs/:id", authenticateToken, requireUserType(["admin","officer"]), async(req, res, next) =>{
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
