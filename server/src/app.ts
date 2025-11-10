import express from "express";
import path from "path";
import cors from "cors";
import { CONFIG } from "@config";
import { authRouter } from "@routes/AuthRoutes";
import { userRouter } from "@routes/UserRoutes";
import { reportRouter } from "@routes/ReportRoutes";
import {officerRouter} from "@routes/OfficerRoutes";
import { infoTypeRouter } from "@routes/InfoType";
export const app = express();
let routes = CONFIG.ROUTES;
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(routes.V1_AUTH, authRouter);
app.use(routes.V1_USERS, userRouter);
app.use(routes.V1_REPORTS, reportRouter);
app.use(routes.V1_OFFICERS, officerRouter);
app.use(routes.V1_INFO_TYPES, infoTypeRouter);
// static files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

export default app;