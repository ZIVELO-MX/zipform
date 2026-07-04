import type { PrismaClient } from "@prisma/client";

export class ReleaseBaselineError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ReleaseBaselineError";
  }
}

export const release1Projects = [
  { id: "project-koda", slug: "koda", name: "Koda", description: "Operación y evolución de Koda.", descriptionDetail: "", color: "#f97316", icon: "Utensils", status: "active", type: "normal" },
  { id: "project-fidelity", slug: "fidelity", name: "Fidelity", description: "Programa Fidelity de Zivelo.", descriptionDetail: "", color: "#f97316", icon: "Star", status: "active", type: "normal" },
  { id: "project-tloz", slug: "tloz", name: "TLOZ", description: "The Legend of Zivelo.", descriptionDetail: "", color: "#d72228", icon: "Sword", status: "active", type: "normal" },
  { id: "project-web-corporativa", slug: "web-corporativa", name: "Web Corporativa", description: "Sitio web corporativo de Zivelo.", descriptionDetail: "", color: "#2563eb", icon: "Globe2", status: "active", type: "normal" },
] as const;

export function resolveReleaseProjectOwners(userIds: string[]) {
  if (userIds.length === 0) {
    throw new ReleaseBaselineError("Cannot prepare the release baseline because no users exist.");
  }
  const primaryOwnerId = userIds.includes("benji") ? "benji" : userIds[0];
  const fidelityOwnerId = userIds.includes("raul") ? "raul" : primaryOwnerId;
  return { primaryOwnerId, fidelityOwnerId };
}

export async function prepareRelease1Baseline(prisma: PrismaClient) {
  const users = await prisma.user.findMany({ select: { id: true }, orderBy: { createdAt: "asc" } });
  const owners = resolveReleaseProjectOwners(users.map(({ id }) => id));
  const now = new Date();
  const startDate = now.toISOString().slice(0, 10);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.tlozUserMissionState.deleteMany();
      await tx.tlozResource.deleteMany();
      await tx.tlozChecklistItem.deleteMany();
      await tx.tlozMissionQuestItem.deleteMany();
      await tx.tlozMissionDependency.deleteMany();
      await tx.tlozMission.deleteMany();
      await tx.tlozEpisode.deleteMany();
      await tx.tlozSeason.deleteMany();
      await tx.tlozQuestItem.deleteMany();
      await tx.tlozProject.deleteMany();
      await tx.tlozProject.createMany({
        data: release1Projects.map((project) => ({
          ...project,
          ownerId: project.id === "project-fidelity" ? owners.fidelityOwnerId : owners.primaryOwnerId,
          startDate,
          createdAt: now,
          updatedAt: now,
        })),
      });
    });
  } catch (error) {
    throw new ReleaseBaselineError(
      "Failed to prepare the TLOZ release baseline; the transaction was rolled back.",
      { cause: error },
    );
  }

  return { preservedUserCount: users.length, projectCount: release1Projects.length };
}
