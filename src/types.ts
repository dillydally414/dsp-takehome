/** Contains types representing interactions with the MBTA API */
namespace API {
  export type FilterQueryParams = {
    [key: string]: string | number | string[] | number[];
  };

  /** Error type that can be returned by the API */
  type MBTAError = {
    code: string;
    status: string;
  };

  /** Includes general info present on API responses */
  type JSONAPI = {
    version: string;
  };

  /** Generalize the format of the MBTA API responses */
  export type MBTAResponse<T> = JSONAPI &
    ({ data: T } | { errors: MBTAError[] });

  /** Some values common to all resources */
  type Resource = {
    id: string;
    type: string;
    links: {
      self: string;
    };
  };

  /** Represents a route as returned by the generic routes API  (`/routes`) */
  export type RouteResource = Resource & {
    attributes: {
      color: string;
      description: string;
      direction_destinations: [string, string];
      direction_names: [string, string];
      fare_class: string;
      long_name: string;
      short_name: string;
      sort_order: number;
      text_color: string;
      type: number;
    };
    relationships: {
      line: { data: { id: string; type: string } };
    };
  };

  /** Response type of the routes api (`/routes`) */
  export type RoutesResponse = MBTAResponse<RouteResource[]>;

  /** Represents a stop as returned by the generic routes API  (`/stops`) */
  export type StopResource = Resource & {
    attributes: {
      address: string;
      at_street: string;
      description: string;
      latitude: number;
      location_type: number;
      longitude: number;
      municipality: string;
      name: string;
      on_street: string;
      platform_code: string;
      platform_name: string;
      vehicle_type: number;
      wheelchair_boarding: number;
    };
    relationships: {
      parent_station: {
        links: {
          self: string;
          related: string;
        };
        data: {
          type: string;
          id: string;
        };
      };
    };
  };

  /** Response type of the stops api (`/stops`) */
  export type StopsResponse = MBTAResponse<StopResource[]>;
}

/** Contains types used internally in the handling and processing of API responses */
namespace Internal {
  /** Represents a subway line with a count of stops on that line */
  export type LineStops = {
    lineName: string;
    stopCount: number;
  };

  /** Represents a station that connects two or more subway lines */
  export type TransferStation = {
    stationName: string;
    lines: string[];
  };

  /** Represents a collection of information about the MBTA subway lines */
  export type AggregateInfo = {
    mostStops: LineStops;
    fewestStops: LineStops;
    transferStations: TransferStation[];
  };

  /** Represents a single leg on a trip, getting on a specified line at a specified stop */
  export type TripStep = {
    stop: string;
    line: string;
  };

  /** Represents a trip from one stop to another */
  export type Trip = {
    steps: TripStep[];
  };

  /** Represents an error thrown by our API Client and handled internally */
  export class CustomError extends Error {
    code: number;

    constructor({ code, message }: { code: number; message: string }) {
      super(message);
      this.code = code;
    }
  }
}

export { API, Internal };
