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
      return `An unknown error occurred.\n${err}`;
    }
  }

  /** Returns the long-form name of each of the subway routes */
  async subwayRouteNames(): Promise<string> {
    try {
      const routes: API.RouteResource[] = await APIClient.getSubwayRoutes();
      const output: string = routes
        .map((route) => route.attributes.long_name)
        .join(", ");
      return `Here is a list of all subway lines:\n${output}`;
    } catch (err) {
      return this.handleError(err);
    }
  }

  /**
   * Determines which route has the most stops. If two or more routes have the same number, all routes with that
   * number of stops will be included in the output
   * @param routeToStops a map from each route to stops on that route
   */
  getRoutesWithMostStops(
    routeToStops: Map<API.RouteResource, API.StopResource[]>
  ): Internal.LineStops {
    let mostStops: Internal.LineStops = {
      lineName: "",
      stopCount: 0,
    };
    for (const [route, stops] of routeToStops.entries()) {
      if (mostStops.lineName === "" || mostStops.stopCount < stops.length) {
        // update mostStops with the new largest amount
        mostStops = {
          lineName: route.attributes.long_name,
          stopCount: stops.length,
        };
      } else if (mostStops.stopCount === stops.length) {
        // add this route to the name to acknowledge tie
        mostStops.lineName = `${mostStops.lineName}, ${route.attributes.long_name}`;
      }
    }
    return mostStops;
  }

  /**
   * Determines which route has the fewest stops. If two or more routes have the same number, all routes with that
   * number of stops will be included in the output
   * @param routeToStops a map from each route to stops on that route
   */
  getRoutesWithFewestStops(
    routeToStops: Map<API.RouteResource, API.StopResource[]>
  ): Internal.LineStops {
    let fewestStops: Internal.LineStops = {
      lineName: "",
      stopCount: 0,
    };
    for (const [route, stops] of routeToStops.entries()) {
      if (fewestStops.lineName === "" || fewestStops.stopCount > stops.length) {
        // update fewestStops with the new smallest amount
        fewestStops = {
          lineName: route.attributes.long_name,
          stopCount: stops.length,
        };
      } else if (fewestStops.stopCount === stops.length) {
        // add this route to the name to acknowledge tie
        fewestStops.lineName = `${fewestStops.lineName}, ${route.attributes.long_name}`;
      }
    }
    return fewestStops;
  }

  /**
   * Finds stops that are present on more than one route.
   * @param routeToStops a map from each route to stops on that route
   */
  getTransferStations(
    routeToStops: Map<API.RouteResource, API.StopResource[]>
  ): Internal.TransferStation[] {
    const stopToRoutes: Map<string, string[]> = new Map();
    const idToStop: Map<string, API.StopResource> = new Map();
    const idToRoute: Map<string, API.RouteResource> = new Map();

    for (const [route, stops] of routeToStops.entries()) {
      idToRoute.set(route.id, route);

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

    return transferStations;
  }

  /** Returns some key information about the MBTA routes */
  async collectAggregateInfo(): Promise<Internal.AggregateInfo> {
    const routeToStops: Map<API.RouteResource, API.StopResource[]> =
      await APIClient.getSubwayStopsByRoute();

    return {
      mostStops: this.getRoutesWithMostStops(routeToStops),
      fewestStops: this.getRoutesWithFewestStops(routeToStops),
      transferStations: this.getTransferStations(routeToStops),
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

  /**
   * Finds a subway trip from `start` to `end`.
   * @param start the ID or name of the starting stop
   * @param end the ID or name of the ending stop
   */
  async findTrip(start: string, end: string): Promise<Internal.Trip> {
    // retrieve route to stops mapping and generate list of transfer stations
    const routeToStops: Map<API.RouteResource, API.StopResource[]> =
      await APIClient.getSubwayStopsByRoute();
    const allStops = _.flatten([...routeToStops.values()]);
    const transferStations: Internal.TransferStation[] =
      this.getTransferStations(routeToStops);
    const transferStops: API.StopResource[] = _.compact(
      transferStations.map((ts) =>
        allStops.find(
          (stop) =>
            stop.attributes.name.toUpperCase() === ts.stationName.toUpperCase()
        )
      )
    );

    // find the actual stop resources for the provided start and end, if not found throw an error
    const startStop = allStops.find(
      (stop) =>
        stop.attributes.name.toUpperCase() === start.toUpperCase() ||
        stop.id === start
    );
    if (startStop === undefined) {
      throw new Internal.CustomError({
        code: 400,
        message: `Starting stop ${start} could not be found.`,
      });
    }
    const endStop = allStops.find(
      (stop) =>
        stop.attributes.name.toUpperCase() === end.toUpperCase() ||
        stop.id === end
    );
    if (endStop === undefined) {
      throw new Internal.CustomError({
        code: 400,
        message: `Ending stop ${end} could not be found.`,
      });
    }

    /** Gets the lines that a stop is on.
     * @param stop the stop to search line for
     */
    const getLines = (stop: API.StopResource): string[] => {
      const transfer = transferStations.find(
        (ts) =>
          ts.stationName.toUpperCase() === stop.attributes.name.toUpperCase()
      );
      if (transfer) {
        return transfer.lines;
      } else {
        // it can only be part of one line if it's not a transfer so we can terminate early
        for (const [route, stops] of routeToStops.entries()) {
          if (stops.some((s) => s.id === stop.id)) {
            return [route.attributes.long_name];
          }
        }
      }
      throw new Internal.CustomError({
        code: 500,
        message: `Could not determine what line ${stop.attributes.name} is on.`,
      });
    };

    // set up parent mapping, queue, and list of unvisited stops
    const stopToPrev = new Map<string, { stop: string; line: string }>();
    const queue = [startStop];
    let remainingStops = [endStop, ...transferStops].map((stop) => ({
      stop: stop,
      lines: getLines(stop),
    }));
    // using BFS as it's relatively simple and has the addest bonus of finding a trip with least # of transfers
    // nodes are start, end, and transfers
    // edges are routes (can go between nodes on same route)
    // at each step (terminates when we've reached the end stop):
    // 1. check if current and end are on the same line. if they are, this step will just be taking the line from the current to the end
    // 2. if current and end are on different lines, check if there are any transfers from current's line to end's line.
    // 3. use transfer station from current line to end's line if exists, otherwise
    while (queue.length > 0) {
      const [curr] = queue.splice(0, 1);
      if (curr.id === endStop.id) {
        // we have reached end, rebuild path from stopToPrev
        let steps: (Internal.TripStep | undefined)[] = [
          { stop: endStop.attributes.name, line: "" },
        ];
        while (stopToPrev.has(steps.at(-1)?.stop || "")) {
          steps.push(stopToPrev.get(steps.at(-1)?.stop || ""));
        }
        return {
          steps: _.compact(steps.reverse()),
        };
      } else {
        // keep looking :(
        for (const line of getLines(curr)) {
          // find stops on the same line
          const connections = remainingStops.filter((stop) =>
            stop.lines.includes(line)
          );
          remainingStops = remainingStops.filter(
            (stop) => !stop.lines.includes(line)
          );
          for (const connection of connections) {
            stopToPrev.set(connection.stop.attributes.name, {
              stop: curr.attributes.name,
              line,
            });
          }
          queue.push(...connections.map((c) => c.stop));
        }
      }
    }
    throw new Internal.CustomError({
      code: 400,
      message: `No subway trip could be found between ${start} and ${end}.`,
    });
  }

  /**
   * Finds a subway trip from `start` to `end` and returns a human-readable output.
   * @param start the ID of the starting stop
   * @param end the ID of the ending stop
   * `${i}. Take the ${prev.line} from ${prev.stop} to ${next.stop}.`
   */
  async tripSummary(start: string, end: string): Promise<string> {
    try {
      const trip: Internal.Trip = await this.findTrip(start, end);
      const output: string = `To get from ${trip.steps[0].stop} to ${
        trip.steps.at(-1)?.stop
      }, you can take the following trip:\n${trip.steps
        .slice(0, -1)
        .map((curr, i) => {
          return `${i + 1}. Take the ${curr.line} from ${curr.stop} to ${
            trip.steps[i + 1].stop
          }.`;
        })
        .join("\n")}`;
      return output;
    } catch (err) {
      return this.handleError(err);
    }
  }
}

export default new MBTAInfo();
