import {Router} from "express";
import {loginOfficer} from "@controllers/authController"
import {createUser,logoutUser, getMyProfile, updateMyProfile} from "@controllers/userController"
import { authenticateToken, requireUserType } from "@middlewares/authMiddleware"
import { UserFromJSON } from "@dto/User";
import { uploadAvatar } from "@middlewares/uploadMiddleware";
const router = Router({mergeParams : true});


router.get("/logout",authenticateToken, async(req, res, next) =>{
    try{
        console.log("Logging out user");
        await logoutUser();
        res.status(200).json()
    }
    catch(error)
    {
        next(error);
    }
});
router.post("/", async(req, res, next) =>{
    try{
        const userData = UserFromJSON(req.body);
        const result = await createUser(userData);
        res.status(200).json(result);
    }
    catch(error)
    {
        next(error);
    }
});

//? GET /users/me (retrieve personal account info story 9)
router.get("/me", authenticateToken, async (req, res, next) => {
  try {
    const userId = (req as any).user?.id;
    const profile = await getMyProfile(userId);
    res.status(200).json(profile);
  } catch (err) {
    next(err);
  }
});

//? PATCH /users/me (update personal account info story 9)
router.patch("/me", authenticateToken, uploadAvatar, async (req, res, next) => {
  try {
    const userId = (req as any).user?.id;

    // body may come in req.body (fields) and req.file (avatar)
    const telegramUsername = req.body.telegramUsername ?? undefined;
    const emailNotificationsRaw = req.body.emailNotifications;
    const emailNotifications = emailNotificationsRaw !== undefined ? (emailNotificationsRaw === "true" || emailNotificationsRaw === true) : undefined;
    const avatarPath = req.file ? `/uploads/avatars/${(req.file as any).filename}` : undefined;

    const updated = await updateMyProfile(userId, {
      telegramUsername,
      emailNotifications,
      avatarPath,
    });
    
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
});

export {router as userRouter};