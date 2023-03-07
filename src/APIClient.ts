import { API } from "./types";
import dotenv from "dotenv";
dotenv.config();

/** The API Client for interacting with the MBTA API */
class APIClient {
  /** Serves as a middleware for fetch that wraps in the prefix and headers */
  async fetch(route: string) {
    return fetch(`https://api-v3.mbta.com/${route}`, {
      headers: new Headers({
        "X-API-Key": process.env.MBTA_API_KEY || "",
      }),
    });
  }

  /** Gets all "subway" routes - light raile (type 0) and heavy rail (type 1).
   * I decided to do the filtering myself as the filtering functionality allows for easier extension later on,
   * rather than needing to rely on the built-in API filters to have the appropriate functionality
   */
  async getSubwayRoutes(): Promise<API.RouteSummary[]> {
    return this.getRoutesMatching(
      (r) => r.attributes.type === 0 || r.attributes.type === 1
    );
  }

  /**
   * Gets all routes that match a filtering condition.
   * @param predicate a function that returns true for routes included in the results.
   */
  async getRoutesMatching(
    predicate: (r: API.RouteSummary) => boolean
  ): Promise<API.RouteSummary[]> {
    try {
      const response = (await (
        await this.fetch("/routes")
      ).json()) as API.RoutesResponse;
      if (response.errors !== undefined && response.errors.length > 0) {
        throw new API.CustomError({
          code: Number.parseInt(response.errors[0].status),
          message: response.errors[0].code,
        });
      } else {
        return response.data.filter(predicate);
      }
    } catch (err: any) {
      if (err instanceof API.CustomError) {
        throw err;
      } else {
        throw new API.CustomError({
          code: 500,
          message: `${err.message || "Internal Error."}`,
        });
      }
    }
  }
}

export default new APIClient();
