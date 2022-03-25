import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CreatorProfileExchangeComponent } from "./creator-profile-exchange.component";

describe("CreatorProfileExchangeComponent", () => {
  let component: CreatorProfileExchangeComponent;
  let fixture: ComponentFixture<CreatorProfileExchangeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CreatorProfileExchangeComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreatorProfileExchangeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
