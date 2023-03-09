import { API, Internal } from "./types";
import dotenv from "dotenv";
dotenv.config();

/** The API Client for interacting with the MBTA API */
class APIClient {
  /** Serves as a middleware for fetch that wraps in the prefix, headers, and query string */
  async fetch(
    route: string,
    queryFilters?: {
      [key: string]: string | number | string[] | number[];
    }
  ) {
    // converts filtering conditions into the query string
    const queryString = Object.entries(queryFilters || {})
      .map(([key, value]) => {
        return `filter[${key}]=${
          value instanceof Array ? value.join(",") : value
        }`;
      })
      .join("&");
    return (
      await fetch(`https://api-v3.mbta.com/${route}?${queryString}`, {
        headers: new Headers({
          "X-API-Key": process.env.MBTA_API_KEY || "",
        }),
      })
    ).json();
  }

  /**
   * Enforces that the provided response does not have any errors. If the response does, a CustomError is thrown
   * corresponding to the first error encountered. Otherwise, the response is returned, now with type
   * narrowed to ensure errors are not present.
   * @param response The response from the MBTA API
   */
  enforceNoErrors<T>(response: API.MBTAResponse<T>) {
    if ("errors" in response) {
      throw new Internal.CustomError({
        code: Number.parseInt(response.errors[0].status),
        message: response.errors[0].code,
      });
    } else {
      return response;
    }
  }

  /**
   * Handles a provided error, converting it into a CustomError if it is not already.
   * @param err the error to handle
   */
  handleError(err: any): Internal.CustomError {
    if (err instanceof Internal.CustomError) {
      return err;
    } else {
      return new Internal.CustomError({
        code: 500,
        message: `${err.message || "Internal Error."}`,
      });
    }
  }

  /**
   * Gets all routes that match optional filtering conditions.
   * @param queryFilters optional filtering conditions, represented as an object mapping query keys to values
   */
  async getRoutes(queryFilters?: {
    [key: string]: string | number | string[] | number[];
  }): Promise<API.RouteResource[]> {
    try {
      const response = (await this.fetch(
        "/routes",
        queryFilters
      )) as API.RoutesResponse;
      const cleanedResponse = this.enforceNoErrors(response);
      return cleanedResponse.data;
    } catch (err: any) {
      throw this.handleError(err);
    }
  }

  /** Gets all "subway" routes - light rail (type 0) and heavy rail (type 1).
   * I decided to use the built in MBTA filtering as it has some capabilities that cannot be performed
   * simply by filtering the response data (e.g. filtering stops by route). I also have designed my code such that it allows
   * for future filtering and isn't limited to filtering by routes
   */
  async getSubwayRoutes(): Promise<API.RouteResource[]> {
    return this.getRoutes({
      type: [0, 1],
    });
  }

  /**
   * Gets all stops that match optional filtering conditions.
   * @param queryFilters optional filtering conditions, represented as an object mapping query keys to values
   */
  async getStopsMatching(queryFilters?: {
    [key: string]: string | number | string[] | number[];
  }): Promise<API.StopResource[]> {
    try {
      const response = (await this.fetch(
        "/stops",
        queryFilters
      )) as API.StopsResponse;
      const cleanedResponse = this.enforceNoErrors(response);
      return cleanedResponse.data;
    } catch (err: any) {
      throw this.handleError(err);
    }
  }

  /** Gets all "subway" stops - light rail (type 0) and heavy rail (type 1), grouped by route. */
  async getSubwayStopsByRoute(): Promise<
    Map<API.RouteResource, API.StopResource[]>
  > {
    const subwayRoutes = await this.getSubwayRoutes();
    const routeToStops: Map<API.RouteResource, API.StopResource[]> = new Map();
    const promiseList = subwayRoutes.map(async (route) => {
      return this.getStopsMatching({
        route: route.id,
      }).then((stops) => {
        routeToStops.set(route, stops);
      });
    });
    await Promise.all(promiseList);
    return routeToStops;
  }
}

export default new APIClient();
