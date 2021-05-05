import { ComponentFixture, TestBed } from "@angular/core/testing";

import { CreatorDiamondsComponent } from "./creator-diamonds.component";

describe("CreatorDiamondsComponent", () => {
  let component: CreatorDiamondsComponent;
  let fixture: ComponentFixture<CreatorDiamondsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CreatorDiamondsComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreatorDiamondsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
