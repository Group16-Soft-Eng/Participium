//! MAINTAINER CONTROLLER
import { MaintainerRepository } from "@repositories/MaintainerRepository";
import { ReportRepository } from "@repositories/ReportRepository";
import { OfficeType } from "@models/enums/OfficeType";

export async function createMaintainer(name: string, email: string, password: string,  categories: OfficeType[], active: boolean = true) {
  const repo = new MaintainerRepository();
  const maintainer = await repo.createMaintainer(name, email, password, categories, active);
  return maintainer;
}

export async function getMaintainersByCategory(category: OfficeType) {
  const repo = new MaintainerRepository();
  const maintainers = await repo.getMaintainersByCategory(category);
  return maintainers;
}

export async function getAllMaintainers() {
  const repo = new MaintainerRepository();
  const maintainers = await repo.getAllMaintainers();
  return maintainers;
}

export async function getMaintainerById(id: number) {
  const repo = new MaintainerRepository();
  const maintainer = await repo.getMaintainerById(id);
  return maintainer;
}

export async function getMaintainerByEmail(email: string) {
  const repo = new MaintainerRepository();
  const maintainer = await repo.getMaintainerByEmail(email);
  return maintainer;
}

export async function updateMaintainer(id: number, fields: { name?: string; email?: string; categories?: OfficeType[]; active?: boolean; }) {
  const repo = new MaintainerRepository();
  const updatedMaintainer = await repo.updateMaintainer(id, fields as any);
  return updatedMaintainer;
}

export async function assignReportToMaintainer(reportId: number, maintainerId: number) {
  const reportRepo = new ReportRepository();
  const maintainerRepo = new MaintainerRepository();
  
    // Verifica che il report sia in stato PENDING
    const report = await reportRepo.getReportById(reportId);
    if (report.state !== ReportState.PENDING) {
      throw new Error("Only PENDING reports can be assigned");
    }
  
    // Verifica che il maintainer esista
    const maintainer = await maintainerRepo.getMaintainerById(maintainerId);
    if (!maintainer) {
      throw new Error("Maintainer not found");
    }

    await reportRepo.assignReportToMaintainer(reportId, maintainerId);
}
