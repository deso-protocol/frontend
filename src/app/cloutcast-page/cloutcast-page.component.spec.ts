import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CloutCastPageComponent } from './cloutcast-page.component';

describe('CloutCastPageComponent', () => {
  let component: CloutCastPageComponent;
  let fixture: ComponentFixture<CloutCastPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CloutCastPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CloutCastPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
