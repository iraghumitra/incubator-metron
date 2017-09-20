import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {TimeRangeComponent} from './time-range.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [TimeRangeComponent],
  exports: [TimeRangeComponent]
})
export class TimeRangeModule { }
