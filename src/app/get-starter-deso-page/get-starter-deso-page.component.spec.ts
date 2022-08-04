import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GetStarterDeSoPageComponent } from './get-starter-deso-page.component';

describe('GetStarterDeSoPageComponent', () => {
  let component: GetStarterDeSoPageComponent;
  let fixture: ComponentFixture<GetStarterDeSoPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GetStarterDeSoPageComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GetStarterDeSoPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
