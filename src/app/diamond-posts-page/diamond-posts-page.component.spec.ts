import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DiamondPostsPageComponent } from './diamond-posts-page.component';

describe('DiamondPostsPageComponent', () => {
  let component: DiamondPostsPageComponent;
  let fixture: ComponentFixture<DiamondPostsPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DiamondPostsPageComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DiamondPostsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
