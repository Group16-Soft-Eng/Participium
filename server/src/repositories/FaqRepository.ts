import { Repository } from "typeorm";
import { AppDataSource } from "@database";
import { FaqDAO } from "@dao/FaqDAO";

export class FaqRepository {
  private repo: Repository<FaqDAO>;

  constructor() {
    this.repo = AppDataSource.getRepository(FaqDAO);
  }

  async getAllFaqs(): Promise<FaqDAO[]> {
    return this.repo.find();
  }
}