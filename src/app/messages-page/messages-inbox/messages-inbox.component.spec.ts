import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { MessagesInboxComponent } from "./messages-inbox.component";

describe("MessagesInboxComponent", () => {
  let component: MessagesInboxComponent;
  let fixture: ComponentFixture<MessagesInboxComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [MessagesInboxComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MessagesInboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
