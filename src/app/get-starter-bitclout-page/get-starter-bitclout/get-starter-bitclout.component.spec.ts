import { ComponentFixture, TestBed } from "@angular/core/testing";

import { GetStarterBitcloutComponent } from "./get-starter-bitclout.component";

describe("GetStarterBitcloutComponent", () => {
  let component: GetStarterBitcloutComponent;
  let fixture: ComponentFixture<GetStarterBitcloutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GetStarterBitcloutComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GetStarterBitcloutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
