import {Router} from "express";
import {ReportFromJSON} from "@dto/Report";
import { authenticateToken, requireUserType } from "@middlewares/authMiddleware"
import { ReportRepository } from "@repositories/ReportRepository";
import { FollowRepository } from "@repositories/FollowRepository";
import { FaqRepository } from "@repositories/FaqRepository";


const router = Router({mergeParams : true});

router.get("/reports", authenticateToken, requireUserType(["user"]), async (req, res) => {

    const reportRepo = new ReportRepository();
    const userId = (req as any).user?.id;

    let reports;
    reports = await reportRepo.getReportsByUserId(userId);

    res.status(200).json(reports.map(ReportFromJSON));
});

router.get("/faq", authenticateToken, requireUserType(["user"]), async (req, res) => {
    const faqRepo = new FaqRepository();
    const faqs = await faqRepo.getAllFaqs();

    res.status(200).json(faqs);
});

//Follow all personal reports
router.post("/reports", authenticateToken, requireUserType(["user"]), async (req, res) => {

    const userId = (req as any).user?.id;
    const followRepo = new FollowRepository();
    await followRepo.followAllPersonal(userId, "telegram");
    res.status(201).json("Followed all personal reports.");
});

//Follow a specificreport
router.post("/reports/:reportId",authenticateToken, requireUserType(["user"]),  async (req, res) => {

    const userId = (req as any).user?.id;
    const reportId = Number.parseInt(req.params.reportId);

    const followRepo = new FollowRepository();
    await followRepo.follow(userId, reportId, "telegram");
    res.status(200).json({ message: "Follow created successfully." });
});
//User unfollows only specific report
router.delete("/reports/:reportId",authenticateToken, requireUserType(["user"]),  async (req, res) => {

    const userId = (req as any).user?.id;
    const reportId = Number.parseInt(req.params.reportId);

    const followRepo = new FollowRepository();
    await followRepo.unfollow(userId, reportId, "telegram");
    res.status(200).json({ message: "Follow deleted successfully." });
});

//Unfollow all reports
router.delete("/reports", authenticateToken, requireUserType(["user"]),  async (req, res) => {

    const userId = (req as any).user?.id;
    const followRepo = new FollowRepository();
    await followRepo.unfollowAllByUser(userId, "telegram");
    res.status(200).json({ message: "All reports unfollowed successfully." });
});


export {router as telegramRouter};