import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SimpleCenterLoaderComponent } from './simple-center-loader.component';

describe('SimpleCenterLoaderComponent', () => {
  let component: SimpleCenterLoaderComponent;
  let fixture: ComponentFixture<SimpleCenterLoaderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SimpleCenterLoaderComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SimpleCenterLoaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
