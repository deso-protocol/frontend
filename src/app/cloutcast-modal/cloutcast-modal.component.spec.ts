import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CloutCastModalComponent } from './cloutcast-modal.component';

describe('CloutCastModalComponent', () => {
  let component: CloutCastModalComponent;
  let fixture: ComponentFixture<CloutCastModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CloutCastModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CloutCastModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
