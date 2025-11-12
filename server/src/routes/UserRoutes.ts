import {Router} from "express";
import {loginOfficer} from "@controllers/authController"
import {createUser,logoutUser} from "@controllers/userController"
import { authenticateToken, requireUserType } from "@middlewares/authMiddleware"
import { UserFromJSON } from "@dto/User";
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
export {router as userRouter};