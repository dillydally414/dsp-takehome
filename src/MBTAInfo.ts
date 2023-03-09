import APIClient from "./APIClient";
import { API, Internal } from "./types";
import _ from "lodash";

/** Represents information about the MBTA system and holds methods for simple questions */
class MBTAInfo {
  /** Converts an error into a human-readable format */
  handleError(err: any): string {
    if (err instanceof Internal.CustomError) {
      return `An error occurred with status code ${err.code}: ${err.message}`;
    } else {
      return "An unknown error occurred.";
    }
  }

  /** Returns the long-form name of each of the subway routes */
  async subwayRouteNames(): Promise<string> {
    try {
      const routes: API.RouteResource[] = await APIClient.getSubwayRoutes();
      const output: string = routes
        .map((route) => route.attributes.long_name)
        .join(", ");
      return output;
    } catch (err) {
      return this.handleError(err);
    }
  }

  /** Returns some key information about the MBTA routes */
  async collectAggregateInfo(): Promise<Internal.AggregateInfo> {
    const routeToStops: Map<API.RouteResource, API.StopResource[]> =
      await APIClient.getSubwayStopsByRoute();
    let mostStops: Internal.LineStops = {
      lineName: "",
      stopCount: 0,
    };
    let fewestStops: Internal.LineStops = {
      lineName: "",
      stopCount: 0,
    };
    const stopToRoutes: Map<string, string[]> = new Map();
    const idToStop: Map<string, API.StopResource> = new Map();
    const idToRoute: Map<string, API.RouteResource> = new Map();

    /** Ties for shortest and longest will result in a combination of names */
    for (const [route, stops] of routeToStops.entries()) {
      idToRoute.set(route.id, route);
      // update mostStops
      if (mostStops.lineName === "" || mostStops.stopCount < stops.length) {
        mostStops = {
          lineName: route.attributes.long_name,
          stopCount: stops.length,
        };
      } else if (mostStops.stopCount === stops.length) {
        mostStops.lineName = `${mostStops.lineName}, ${route.attributes.long_name}`;
      }

      // update fewestStops
      if (fewestStops.lineName === "" || fewestStops.stopCount > stops.length) {
        fewestStops = {
          lineName: route.attributes.long_name,
          stopCount: stops.length,
        };
      } else if (fewestStops.stopCount === stops.length) {
        fewestStops.lineName = `${fewestStops.lineName}, ${route.attributes.long_name}`;
      }

      // add to reverse map, which will help check for transfer stations
      for (const stop of stops) {
        idToStop.set(stop.id, stop);
        if (!stopToRoutes.has(stop.id)) {
          stopToRoutes.set(stop.id, []);
        }
        stopToRoutes.get(stop.id)?.push(route.id);
      }
    }

    // collect transfer stations by filtering out stops with only 1 route
    const transferStations: Internal.TransferStation[] = _.compact(
      [...stopToRoutes.entries()].map(
        ([stop, routes]): Internal.TransferStation | undefined => {
          if (routes.length > 1) {
            return {
              stationName:
                idToStop.get(stop)?.attributes.name || "unknown stop",
              lines: routes.map(
                (r) => idToRoute.get(r)?.attributes.long_name || "unknown route"
              ),
            };
          } else {
            return undefined;
          }
        }
      )
    );

    return {
      mostStops,
      fewestStops,
      transferStations,
    };
  }

  /** Returns a human-readable version of some key information about the MBTA routes */
  async aggregateInfo(): Promise<string> {
    try {
      const info: Internal.AggregateInfo = await this.collectAggregateInfo();
      const output: string = `The subway line(s) with the most stops is ${
        info.mostStops.lineName
      }, with ${
        info.mostStops.stopCount
      } stops.\nThe subway line(s) with the fewest stops is ${
        info.fewestStops.lineName
      }, with ${
        info.fewestStops.stopCount
      } stops.\nHere is a list of all transfer stations:\n - ${info.transferStations
        .map(
          (station) =>
            `${
              station.stationName
            }, which services the following lines: ${station.lines.join(", ")}`
        )
        .join("\n - ")}`;
      return output;
    } catch (err) {
      return this.handleError(err);
    }
  }
}

export default new MBTAInfo();
