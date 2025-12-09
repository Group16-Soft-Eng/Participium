//! INTERNAL MESSAGE REPOSITORY

import { AppDataSource } from "@database";
import { Repository } from "typeorm";
import { InternalMessageDAO } from "@models/dao/InternalMessageDAO";

export class InternalMessageRepository {
  private repo: Repository<InternalMessageDAO>;
  constructor() {
    this.repo = AppDataSource.getRepository(InternalMessageDAO);
  }

  async listByReport(reportId: number): Promise<InternalMessageDAO[]> {
    // ho messo ASC come order, ma si può cambiare
    return this.repo.find({ where: { reportId }, order: { createdAt: "ASC" } });
  }

  
  async create(msg: Partial<InternalMessageDAO>): Promise<InternalMessageDAO> {
    const entity = this.repo.create(msg as any);
    return this.repo.save(entity);
  }
}