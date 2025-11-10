import {Router} from "express";
import {loginOfficer,loginUser} from "@controllers/authController"
const router = Router({mergeParams : true});



router.post("/users", async(req, res, next) =>{
    try{
        let username = req.body["username"];
        let password = req.body["password"];
        const result = await loginUser(username, password);
        res.status(200).json(result);
    }
    catch(error)
    {
        next(error);
    }
});
router.post("/officers", async(req, res, next) =>{
    try{
        console.log("Login Officer Endpoint Hit");
        const { username, password } = req.body;
        const result = await loginOfficer(username, password);
        res.status(200).json(result);
    }
    catch(error)
    {
        next(error);
    }
});
export {router as authRouter};