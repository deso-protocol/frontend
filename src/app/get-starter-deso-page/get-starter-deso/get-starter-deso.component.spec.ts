import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GetStarterDeSoComponent } from './get-starter-deso.component';

describe('GetStarterDeSoComponent', () => {
  let component: GetStarterDeSoComponent;
  let fixture: ComponentFixture<GetStarterDeSoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GetStarterDeSoComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GetStarterDeSoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
