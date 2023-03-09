import { test, expect } from "@jest/globals";
import MBTAInfo from "../src/MBTAInfo";

test("Test Question 3 correct responses", async () => {
  // This test highlights the correct behavior on a couple examples
  // All examples are deterministic since they have only one fewest-transfer trip
  const neuToMIT = await MBTAInfo.tripSummary(
    "Northeastern University",
    "Kendall/MIT"
  );
  const [neuIntro, eToPark, redToKendall] = neuToMIT.split("\n");
  expect(neuIntro).toEqual(
    expect.stringContaining("from Northeastern University to Kendall/MIT")
  );
  expect(eToPark).toEqual(
    expect.stringContaining(
      "Green Line E from Northeastern University to Park Street"
    )
  );
  expect(redToKendall).toEqual(
    expect.stringContaining("Red Line from Park Street to Kendall/MIT")
  );

  // Check that names and IDs both work for trip summaries, and that names are case-insensitive
  const rugglesToDC = await MBTAInfo.tripSummary(
    "Ruggles",
    "downtown crossing"
  );
  const rugglesToDCIds = await MBTAInfo.tripSummary(
    "place-rugg",
    "place-dwnxg"
  );
  expect(rugglesToDC).toBe(rugglesToDCIds);
  const [rugglesIntro, orangeToDC] = rugglesToDCIds.split("\n");
  expect(rugglesIntro).toEqual(
    expect.stringContaining("from Ruggles to Downtown Crossing")
  );
  expect(orangeToDC).toEqual(
    expect.stringContaining("Orange Line from Ruggles to Downtown Crossing")
  );

  // complex trip - can be accomplished two ways
  // 1. Mattapan -> Ashmont -> Downtown -> State -> Wonderland
  // 2. Mattapan -> Ashmont -> Park Street -> Gov Center -> Wonderland
  // Note 2 expands into multiple options because multiple green lines service Park Street and Gov Center
  const mattapanToWonderland = await MBTAInfo.tripSummary(
    "Mattapan",
    "Wonderland"
  );

  console.log(
    `Question 3 output:\n${neuToMIT}\n${rugglesToDC}\n${mattapanToWonderland}`
  );
});

test("Test Question 3 user input issues", async () => {
  // This test ensures that tripSummary appropriately handles invalid user inputs.
  const invalidStartOutput = await MBTAInfo.tripSummary(
    "place-Downtown",
    "State"
  );
  expect(invalidStartOutput).toBe(
    "An error occurred with status code 400: Starting stop place-Downtown could not be found."
  );
  const invalidEndOutput = await MBTAInfo.tripSummary(
    "Downtown Crossing",
    "Stte"
  );
  expect(invalidEndOutput).toBe(
    "An error occurred with status code 400: Ending stop Stte could not be found."
  );
});
