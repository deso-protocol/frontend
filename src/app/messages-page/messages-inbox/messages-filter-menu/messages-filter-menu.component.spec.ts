import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessagesFilterMenuComponent } from './messages-filter-menu.component';

describe('MessagesFilterMenuComponent', () => {
  let component: MessagesFilterMenuComponent;
  let fixture: ComponentFixture<MessagesFilterMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MessagesFilterMenuComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MessagesFilterMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
