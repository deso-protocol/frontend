import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateProfileGetStarterDeSoComponent } from './update-profile-get-starter-deso.component';

describe('UpdateProfileGetStarterDeSoComponent', () => {
  let component: UpdateProfileGetStarterDeSoComponent;
  let fixture: ComponentFixture<UpdateProfileGetStarterDeSoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UpdateProfileGetStarterDeSoComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UpdateProfileGetStarterDeSoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
