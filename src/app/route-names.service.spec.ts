import { TestBed } from "@angular/core/testing";

import RouteNamesService from "./route-names.service";

describe("RouteNamesService", () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it("should be created", () => {
    const service: RouteNamesService = TestBed.inject(RouteNamesService);
    expect(service).toBeTruthy();
  });
});
