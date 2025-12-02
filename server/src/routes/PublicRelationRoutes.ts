import {Router} from "express";
import {createOfficer,retrieveDocs,reviewDoc, getAllOfficers, updateOfficer, assignReportToOfficer, getAllAssignedReportsOfficer, getAllOfficersByOfficeType} from "@controllers/officerController"
import { authenticateToken, requireUserType } from "@middlewares/authMiddleware"
import {OfficerFromJSON,OfficerToJSON} from "@dto/Officer";
import { OfficerRole } from "@models/enums/OfficerRole";
const router = Router({mergeParams : true});





export {router as PublicRelationRoutes};
