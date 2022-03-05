import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessagesGroupMemberComponent } from './messages-group-member.component';

describe('MessagesGroupMemberComponent', () => {
  let component: MessagesGroupMemberComponent;
  let fixture: ComponentFixture<MessagesGroupMemberComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MessagesGroupMemberComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MessagesGroupMemberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
