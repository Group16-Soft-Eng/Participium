import {Router} from "express";
import { authenticateToken, requireUserType } from "@middlewares/authMiddleware";
import {OfficerRole} from "@models/enums/OfficerRole"
import { FaqRepository } from "@repositories/FaqRepository";
const router = Router({mergeParams : true});


router.get("/" , async (req, res) => {
    const faqRepo = new FaqRepository();
    const faqs = await faqRepo.getAllFaqs();
    
    res.status(200).json(faqs);
});

router.post("/" , authenticateToken, requireUserType([OfficerRole.MUNICIPAL_ADMINISTRATOR, OfficerRole.MUNICIPAL_PUBLIC_RELATIONS_OFFICER, OfficerRole.TECHNICAL_OFFICE_STAFF]), async (req, res) => {
    const faqRepo = new FaqRepository();
    const { question, answer } = req.body;
    
    const newFaq = await faqRepo.createFaq(question, answer);
    res.status(201).json(newFaq);
});

router.patch("/:faqId" , authenticateToken, requireUserType([OfficerRole.MUNICIPAL_ADMINISTRATOR, OfficerRole.MUNICIPAL_PUBLIC_RELATIONS_OFFICER, OfficerRole.TECHNICAL_OFFICE_STAFF]), async (req, res) => {
    const faqRepo = new FaqRepository();
    const faqId = Number.parseInt(req.params.faqId);
    const { question, answer } = req.body;
    
    const updatedFaq = await faqRepo.updateFaq(faqId, question, answer);
    res.status(200).json(updatedFaq);
});

router.delete("/:faqId" , authenticateToken, requireUserType([OfficerRole.MUNICIPAL_ADMINISTRATOR, OfficerRole.MUNICIPAL_PUBLIC_RELATIONS_OFFICER, OfficerRole.TECHNICAL_OFFICE_STAFF]), async (req, res) => {
    const faqRepo = new FaqRepository();
    const faqId = Number.parseInt(req.params.faqId);
    
    await faqRepo.deleteFaq(faqId);
    res.status(200).json({ message: "FAQ deleted successfully." });
});

export {router as faqRouter};