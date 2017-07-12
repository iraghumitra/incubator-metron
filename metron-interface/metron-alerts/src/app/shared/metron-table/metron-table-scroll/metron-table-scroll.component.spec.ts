import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MetronTableScrollComponent } from './metron-table-scroll.component';

describe('MetronTableScrollComponent', () => {
  let component: MetronTableScrollComponent;
  let fixture: ComponentFixture<MetronTableScrollComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MetronTableScrollComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MetronTableScrollComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
