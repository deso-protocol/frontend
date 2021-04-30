import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { MessagesThreadViewComponent } from "./messages-thread-view.component";

describe("MessagesThreadViewComponent", () => {
  let component: MessagesThreadViewComponent;
  let fixture: ComponentFixture<MessagesThreadViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [MessagesThreadViewComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MessagesThreadViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
