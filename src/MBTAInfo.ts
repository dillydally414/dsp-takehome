import APIClient from "./APIClient";
import { API } from "./types";

/** Represents information about the MBTA system and holds methods for simple questions */
class MBTAInfo {
  /** Returns the long-form name of each of the subway routes */
  async printSubwayRouteNames(): Promise<string> {
    try {
      const routes: API.RouteSummary[] = await APIClient.getSubwayRoutes();
      const output: string = routes
        .map((route) => route.attributes.long_name)
        .join(", ");
      return output;
    } catch (err) {
      if (err instanceof API.CustomError) {
        return `An error occurred with status code ${err.code}: ${err.message}`;
      } else {
        return "An unknown error occurred.";
      }
    }
  }
}

export default new MBTAInfo();
