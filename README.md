# DSP Take-home - Dillon Scott

This take-home assignment was completed using Typescript.

## Setup/Installation

This project requires Node v18 or greater.

Ensure `yarn` is installed on your computer by running `yarn --version`. If it is not, install it via `npm install --global yarn`.

Once `yarn` is installed, run `yarn install` to install the necessary packages.

Create a `.env` file in the root directory with the following contents:

```
MBTA_API_KEY=??? # Add an API key here
```

## Directory Structure

Source code is located in the [`src`](src/) folder. Tests are located in the [`tests`](tests/) folder.

Source code is split into 3 files:

- [API Client](src/APIClient.ts) - this file defines the API client that interacts directly with the MBTA API via fetch requests.
- [MBTA Info](src/MBTAInfo.ts) - this file defines some methods that reference the API client, process some of its output, and display the output in a human-readable manner
- [types](src/types.ts) - this file contains type definitions, both those taken from the MBTA API (in namespace API) and those defined for internal use (in namespace Internal)

## Running Tests

Run `yarn test` to run all tests. If you want to run tests for a specific question #, run `yarn test question#`.

Tests are built using the Jest framework.
