import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { MessagesThreadComponent } from "./messages-thread.component";

describe("MessagesThreadComponent", () => {
  let component: MessagesThreadComponent;
  let fixture: ComponentFixture<MessagesThreadComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [MessagesThreadComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MessagesThreadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
