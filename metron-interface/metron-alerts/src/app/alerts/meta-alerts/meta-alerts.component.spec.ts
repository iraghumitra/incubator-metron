import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MetaAlertsComponent } from './meta-alerts.component';

describe('MetaAlertsComponent', () => {
  let component: MetaAlertsComponent;
  let fixture: ComponentFixture<MetaAlertsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MetaAlertsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MetaAlertsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
