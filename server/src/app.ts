import express from "express";
import cors from "cors";
import { CONFIG } from "@config";
import { authRouter } from "@routes/AuthRoutes";
import { userRouter } from "@routes/UserRoutes";
import { reportRouter } from "@routes/ReportRoutes";
import {officerRouter} from "@routes/OfficerRoutes";
export const app = express();
let routes = CONFIG.ROUTES;
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(routes.V1_AUTH, authRouter);
app.use(routes.V1_USERS, userRouter);
app.use(routes.V1_REPORTS, reportRouter);
app.use(routes.V1_OFFICERS, officerRouter);

export default app;