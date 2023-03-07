/** Contains types for interacting with the MBTA API */
namespace API {
  /** Error type that can be returned by the API */
  type MBTAError = {
    code: string;
    status: string;
  };

  /** Includes general info present on API responses */
  type JSONAPI = {
    verison: string;
    errors?: MBTAError[];
  };

  /** Represents a route as returned by the generic routes API  (`/routes`) */
  export type RouteSummary = {
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
    id: string;
    links: {
      self: string;
    };
    relationships: {
      line: { data: { id: string; type: string } };
    };
    type: string;
  };

  /** Response type of the routes api (`/routes`) */
  export type RoutesResponse = JSONAPI & {
    data: RouteSummary[];
  };

  /** Represents an error thrown by our API Client */
  export class CustomError extends Error {
    code: number;

    constructor({ code, message }: { code: number; message: string }) {
      super(message);
      this.code = code;
    }
  }
}

export { API };
