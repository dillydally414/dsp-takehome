import { test, expect } from "@jest/globals";
import MBTAInfo from "../src/MBTAInfo";

const greenLines = ["B", "C", "D", "E"].map((gl) => `Green Line ${gl}`);
const allLines = [
  ...greenLines,
  "Red Line",
  "Orange Line",
  "Blue Line",
  "Mattapan Trolley",
];

const transfers = {
  "Park Street": ["Red Line", ...greenLines],
  "Downtown Crossing": ["Red Line", "Orange Line"],
  Ashmont: ["Red Line", "Mattapan Trolley"],
  "Government Center": ["Blue Line", ...greenLines],
  Boylston: greenLines,
  Arlington: greenLines,
  Copley: greenLines,
  "Hynes Convention Center": greenLines.slice(0, -1),
  Kenmore: greenLines.slice(0, -1),
  State: ["Orange Line", "Blue Line"],
  Haymarket: ["Orange Line", ...greenLines.slice(2)],
  "North Station": ["Orange Line", ...greenLines.slice(2)],
  "Science Park/West End": greenLines.slice(2),
  Lechmere: greenLines.slice(2),
};

/** Determines if the line-by-line output of transfer stations matches the above expected output, in any order
 * @param transferStations the line-by-line output from {@link MBTAInfo.aggregateInfo()}, with the first two lines
 *                         of fewest and most stops omitted
 */
const correctTransferStations = (
  transferStations: string[]
): boolean | string => {
  // make sure the number of stations is the same (output will have one extra due to lead-in line)
  if (transferStations.length - 1 !== Object.keys(transfers).length) {
    return `Number of stations is not correct. Expected ${
      Object.keys(transfers).length
    }, received ${transferStations.length - 1}.`;
  }
  const transferStationsChunked = transferStations.map((ts) => ts.split(","));
  for (let [station, routes] of Object.entries(transfers)) {
    // for each station in the expected data:
    // check if there's a line in the output that includes the station and appropriate routes without any other routes
    // if there isn't, return a message, otherwise, keep looking
    if (
      !transferStationsChunked.some((stationRow) => {
        return [
          stationRow.some((chunk) => chunk.includes(station)),
          ...routes.map((r) => stationRow.some((chunk) => chunk.includes(r))),
          ...allLines
            .filter((l) => !routes.includes(l))
            .map((r) => stationRow.every((chunk) => !chunk.includes(r))),
        ].every((val) => val);
      })
    ) {
      return `Entry for ${station} is either not present or not correct. Expected routes ${routes.join(
        ", "
      )}.`;
    }
  }
  return true;
};

test("Test Question 2 correct response", async () => {
  // This test highlights the correct behavior
  const output = await MBTAInfo.aggregateInfo();
  const [mostStops, fewestStops, ...transferStations] = output.split("\n");
  // check that most stops has the correct lines and number of stops
  expect(mostStops).toContain("Green Line D");
  expect(mostStops).toContain("Green Line E");
  expect(mostStops).toContain("25 stops");
  // check that fewest stops has the correct line and number of stops
  expect(fewestStops).toContain("Mattapan Trolley");
  expect(fewestStops).toContain("8 stops");
  // check that transfer stations has the correct stations and correct lines
  expect(correctTransferStations(transferStations)).toBe(true);

  console.log(`Question 2 output:\n${output}`);
});

test("Test Question 2 transfer station mixups", async () => {
  // This test ensures that correctTransferStations is working correctly to identify any mistakes
  const output = await MBTAInfo.aggregateInfo();
  const [_mostStops, _fewestStops, ...transferStations] = output.split("\n");

  // wrong numbers of stations
  expect(correctTransferStations(transferStations.slice(2))).toBe(
    "Number of stations is not correct. Expected 14, received 12."
  );
  expect(
    correctTransferStations([
      ...transferStations,
      " - Back Bay, which services the following lines: Orange Line, Commuter Rail",
    ])
  ).toBe("Number of stations is not correct. Expected 14, received 15.");

  // different station
  expect(
    correctTransferStations([
      ...transferStations.filter(
        (stationLine) => !stationLine.includes("Lechmere")
      ),
      " - Back Bay, which services the following lines: Orange Line, Commuter Rail",
    ])
  ).toBe(
    "Entry for Lechmere is either not present or not correct. Expected routes Green Line D, Green Line E."
  );

  // line removed
  expect(
    correctTransferStations([
      ...transferStations.filter(
        (stationLine) => !stationLine.includes("Lechmere")
      ),
      " - Lechmere, which services the following lines: Green Line E",
    ])
  ).toBe(
    "Entry for Lechmere is either not present or not correct. Expected routes Green Line D, Green Line E."
  );

  // extra line included
  expect(
    correctTransferStations([
      ...transferStations.filter(
        (stationLine) => !stationLine.includes("Lechmere")
      ),
      " - Lechmere, which services the following lines: Green Line E, Green Line D, Green Line B",
    ])
  ).toBe(
    "Entry for Lechmere is either not present or not correct. Expected routes Green Line D, Green Line E."
  );

  // line changed
  expect(
    correctTransferStations([
      ...transferStations.filter(
        (stationLine) => !stationLine.includes("Lechmere")
      ),
      " - Lechmere, which services the following lines: Green Line E, Green Line C",
    ])
  ).toBe(
    "Entry for Lechmere is either not present or not correct. Expected routes Green Line D, Green Line E."
  );
});
