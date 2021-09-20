import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { PlaceBidPageComponent } from "./place-bid-page.component";

describe("PlaceBidPageComponent", () => {
  let component: PlaceBidPageComponent;
  let fixture: ComponentFixture<PlaceBidPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PlaceBidPageComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlaceBidPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
