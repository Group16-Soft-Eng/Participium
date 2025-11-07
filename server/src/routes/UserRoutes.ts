import {Router} from "express";
import {loginOfficer} from "@controllers/authController"
import {createUser,logoutUser} from "@controllers/userController"

import { User,UserFromJSON } from "@dto/User";
const router = Router({mergeParams : true});


router.get("/users/logout", async(req, res, next) =>{
    try{
        await logoutUser();
        res.status(200).json()
    }
    catch(error)
    {
        next(error);
    }
});
router.post("/users", async(req, res, next) =>{
    try{
        let username = req.body["username"];
        let password = req.body["password"];
        let firstName = req.body["firstName"];
        let lastName = req.body["lastName"];
        let email = req.body["email"];
        let user: User = {
            username: username,
            password: password,
            firstName: firstName,
            lastName: lastName,
            email: email
        };
        const result = await createUser(user);
        res.status(200).json(result);
    }
    catch(error)
    {
        next(error);
    }
});
export {router as userRouter};