import { test, expect } from "@jest/globals";
import MBTAInfo from "../src/MBTAInfo";

test("Test Question 1 correct response", async () => {
  // This test highlights the correct behavior
  // uses set comparison to avoid mandating a specific order
  const names = await MBTAInfo.printSubwayRouteNames();
  const expectedNames = [
    "Green Line B",
    "Green Line C",
    "Green Line D",
    "Green Line E",
    "Blue Line",
    "Orange Line",
    "Red Line",
    "Mattapan Trolley",
  ];
  // check that names is a subset of expected names
  expect(names.split(", ")).toEqual(expect.arrayContaining(expectedNames));
  // check that expected names is a subset of names
  expect(expectedNames).toEqual(expect.arrayContaining(names.split(", ")));

  console.log(`Question 1 output: ${names}`);
});

test("Test Question 1 MBTA error response", async () => {
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
  const names = await MBTAInfo.printSubwayRouteNames();
  expect(names).toBe("An error occurred with status code 403: forbidden.");
});

test("Test Question 1 unknown error response", async () => {
  // This will mock the API request to throw an error with a message
  global.fetch = () => {
    throw new Error("Unexpected Error!");
  };
  const names = await MBTAInfo.printSubwayRouteNames();
  expect(names).toBe(
    "An error occurred with status code 500: Unexpected Error!"
  );
});

test("Test Question 1 empty error message", async () => {
  // This will mock the API request to throw an error with no message
  global.fetch = () => {
    throw new Error();
  };
  const names = await MBTAInfo.printSubwayRouteNames();
  expect(names).toBe("An error occurred with status code 500: Internal Error.");
});
