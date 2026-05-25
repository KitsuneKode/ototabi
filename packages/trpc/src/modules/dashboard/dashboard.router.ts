import { hostProcedure } from "../../trpc";
import { dashboardService } from "./dashboard.service";

export const dashboardRouter = {
  getSummary: hostProcedure.query(({ ctx }) => dashboardService.getSummary(ctx.session.user.id)),
};
