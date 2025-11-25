import { AppDataSource } from "@database";
import { Repository } from "typeorm";
import { NotificationDAO } from "@dao/NotificationDAO";
import { ReportDAO } from "@dao/ReportDAO";

export class NotificationRepository {
    private repo: Repository<NotificationDAO>;

    constructor() {
        this.repo = AppDataSource.getRepository(NotificationDAO);
    }

    //? prende tutte le notifiche/messaggi per uno user (con filtro opzionale su non letti se dovesse servire)
    async listByUser(userId: number, unreadOnly?: boolean): Promise<NotificationDAO[]> {
        const where: any = { userId };
        if (unreadOnly) where.read = false;
        return this.repo.find({ where, order: { createdAt: "DESC" } });
    }

    //? segna come letta una notifica specifica per uno user
    async markRead(id: number, userId: number): Promise<NotificationDAO> {
        const notif = await this.repo.findOneByOrFail({ id });
        if (notif.userId !== userId) {
            throw new Error("Not allowed to modify this notification");
        }
        notif.read = true;
        return this.repo.save(notif);
    }

    //? crea una notifica di cambio stato per l'autore del report (user quindi, se non è anonimo)
    async createStatusChangeNotification(report: ReportDAO): Promise<NotificationDAO | null> {
        if (!report.author || report.author.id === undefined) return null; // anonymous
        return this.repo.save({
            userId: report.author.id,
            reportId: report.id,
            type: "STATUS_CHANGE",
            message: this.buildStatusMessage(report),
            read: false
        });
    }

    //? come sopra, ma per Message (non per cambio di stato) da officer a user
    async createOfficerMessageNotification(report: ReportDAO, officerId: number, text: string): Promise<NotificationDAO | null> {
        if (!report.author || report.author.id === undefined) return null; // anonymous
        const msg = `Message from officer #${officerId}: ${text}`;
        return this.repo.save({
            userId: report.author.id,
            reportId: report.id,
            type: "OFFICER_MESSAGE",
            message: msg,
            read: false
        });
    }

    //? creazione di messaggio di notifica per cambio stato report (chiamato nella createStatusChangeNotification sopra)
    private buildStatusMessage(report: ReportDAO): string {
        // stato == declined (scrivo perchè in risposta, prendendo la reason implementata in precedenza)
        if (report.state === "DECLINED") {
            return `Your report #${report.id} has been DECLINED. Reason: ${report.reason || "N/A"}`;
        }
        // stato diverso da declined -> segno nuovo stato
        return `Your report #${report.id} is now ${report.state}`;
    }
}
