import express from "express";
import cors from "cors";
import { CONFIG } from "@config";
import { userRouter } from "@routes/UserRoutes";
import { reportRouter } from "@routes/ReportRoutes";
import {officerRouter} from "@routes/OfficerRoutes";
export const app = express();

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

app.use("", officerRouter);
app.use("", reportRouter);
app.use("", userRouter);