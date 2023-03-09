import { test, expect } from "@jest/globals";
import MBTAInfo from "../src/MBTAInfo";

test("Test MBTA error response", async () => {
  // This will mock the API request to return the style of errors the MBTA does
  global.fetch = async () => {
    const res = new Response();
    res.json = async () => {
      return {
        errors: [{ status: "403", code: "forbidden." }],
      };
    };
    return res;
  };
  const names = await MBTAInfo.subwayRouteNames();
  expect(names).toBe("An error occurred with status code 403: forbidden.");
  const aggregateInfo = await MBTAInfo.aggregateInfo();
  expect(aggregateInfo).toBe(
    "An error occurred with status code 403: forbidden."
  );
  const tripInfo = await MBTAInfo.tripSummary(
    "Northeastern University",
    "Downtown Crossing"
  );
  expect(tripInfo).toBe("An error occurred with status code 403: forbidden.");
});

test("Test unknown error response", async () => {
  // This will mock the API request to throw an error with a message
  global.fetch = () => {
    throw new Error("Unexpected Error!");
  };
  const names = await MBTAInfo.subwayRouteNames();
  expect(names).toBe(
    "An error occurred with status code 500: Unexpected Error!"
  );
  const aggregateInfo = await MBTAInfo.aggregateInfo();
  expect(aggregateInfo).toBe(
    "An error occurred with status code 500: Unexpected Error!"
  );
  const tripInfo = await MBTAInfo.tripSummary(
    "Northeastern University",
    "Downtown Crossing"
  );
  expect(tripInfo).toBe(
    "An error occurred with status code 500: Unexpected Error!"
  );
});

test("Test empty error message", async () => {
  // This will mock the API request to throw an error with no message
  global.fetch = () => {
    throw new Error();
  };
  const names = await MBTAInfo.subwayRouteNames();
  expect(names).toBe("An error occurred with status code 500: Internal Error.");
  const aggregateInfo = await MBTAInfo.aggregateInfo();
  expect(aggregateInfo).toBe(
    "An error occurred with status code 500: Internal Error."
  );
  const tripInfo = await MBTAInfo.tripSummary(
    "Northeastern University",
    "Downtown Crossing"
  );
  expect(tripInfo).toBe(
    "An error occurred with status code 500: Internal Error."
  );
});
