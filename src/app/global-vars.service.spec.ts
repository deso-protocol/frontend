import { TestBed } from "@angular/core/testing";

import { GlobalVarsService } from "./global-vars.service";

describe("GlobalVarsService", () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it("should be created", () => {
    const service: GlobalVarsService = TestBed.inject(GlobalVarsService);
    expect(service).toBeTruthy();
  });
});
