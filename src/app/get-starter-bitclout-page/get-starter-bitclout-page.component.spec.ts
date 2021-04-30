import { ComponentFixture, TestBed } from "@angular/core/testing";

import { GetStarterBitcloutPageComponent } from "./get-starter-bitclout-page.component";

describe("GetStarterBitcloutPageComponent", () => {
  let component: GetStarterBitcloutPageComponent;
  let fixture: ComponentFixture<GetStarterBitcloutPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GetStarterBitcloutPageComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GetStarterBitcloutPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
