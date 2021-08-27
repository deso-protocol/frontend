import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { MessageRecipientModalComponent } from "./message-recipient-modal.component";

describe("MessageComponent", () => {
  let component: MessageRecipientModalComponent;
  let fixture: ComponentFixture<MessageRecipientModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [MessageRecipientModalComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MessageRecipientModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
