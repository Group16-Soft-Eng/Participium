import {Router} from "express";
import {loginOfficer, loginUser} from "@controllers/authController"
const router = Router({mergeParams : true});

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

//login user
router.post("/users", async(req, res, next) =>{
    try{
        let identifier = req.body["username"];
        let password = req.body["password"];
        
        const isEmail = emailRegex.test(identifier);
        const result = await loginUser(identifier, password, isEmail);
            
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
        const { email, password } = req.body;
        
        const isEmail = emailRegex.test(email);
        const result = await loginOfficer(email, password, isEmail);
            
        res.status(200).json(result);
    }
    catch(error)
    {
        next(error);
    }
});

export {router as authRouter};