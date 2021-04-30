import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { MessagesPageComponent } from "./messages-page.component";

describe("MessagesPageComponent", () => {
  let component: MessagesPageComponent;
  let fixture: ComponentFixture<MessagesPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [MessagesPageComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MessagesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
