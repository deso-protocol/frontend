import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessagesCreateGroupChatComponent } from './messages-create-group-chat.component';

describe('MessagesCreateGroupChatComponent', () => {
  let component: MessagesCreateGroupChatComponent;
  let fixture: ComponentFixture<MessagesCreateGroupChatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MessagesCreateGroupChatComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MessagesCreateGroupChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
