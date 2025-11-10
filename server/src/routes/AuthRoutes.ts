import {Router} from "express";
import {loginOfficer,loginUser} from "@controllers/authController"
const router = Router({mergeParams : true});


//login user
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
//login staff, both officers and admins
router.post("/officers", async(req, res, next) =>{
    try{
        console.log(req.body);
        const { email, password } = req.body;
        const result = await loginOfficer(email, password);
        res.status(200).json(result);
    }
    catch(error)
    {
        next(error);
    }
});
export {router as authRouter};