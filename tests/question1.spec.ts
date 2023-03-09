import { test, expect } from "@jest/globals";
import MBTAInfo from "../src/MBTAInfo";

test("Test Question 1 correct response", async () => {
  // This test highlights the correct behavior
  // uses set comparison to avoid mandating a specific order
  const names = await MBTAInfo.subwayRouteNames();
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
