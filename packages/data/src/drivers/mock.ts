import type { ZipformDataClient } from "../contracts";
import {
  apps,
  checklistItems,
  currentUser,
  episodes,
  metrics,
  missionDependencies,
  missionQuestItems,
  missions,
  projects,
  questItems,
  resources,
  roadmap,
  seasons,
  userMissionStates,
  users
} from "../seed-data";
import { buildTlozDashboardSummary, buildTlozMissionDetail, hydrateMissions } from "../tloz-hydration";

const tlozData = {
  users,
  seasons,
  episodes,
  projects,
  missions,
  missionDependencies,
  questItems,
  missionQuestItems,
  checklistItems,
  resources,
  userMissionStates
};

export function createMockDataClient(): ZipformDataClient {
  return {
    apps: {
      async list() {
        return apps;
      },
      async getById(id) {
        return apps.find((app) => app.id === id) ?? null;
      }
    },
    roadmap: {
      async getSnapshot() {
        return roadmap;
      }
    },
    user: {
      async getCurrent() {
        return currentUser;
      }
    },
    platform: {
      async getMetrics() {
        return metrics;
      }
    },
    tloz: {
      async getDashboardSummary() {
        return buildTlozDashboardSummary(tlozData, currentUser.id);
      },
      async getMissions() {
        return hydrateMissions(tlozData);
      },
      async getMissionDetail(missionId) {
        return buildTlozMissionDetail(tlozData, missionId);
      },
      async getProjects() {
        return projects;
      },
      async getSeasons() {
        return seasons;
      },
      async getEpisodes() {
        return episodes;
      },
      async getQuestItems() {
        return questItems;
      }
    }
  };
}
