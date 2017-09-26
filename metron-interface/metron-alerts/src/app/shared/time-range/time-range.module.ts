import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {TimeRangeComponent} from './time-range.component';
import {SharedModule} from '../shared.module';
import {DatePickerModule} from '../date-picker/date-picker.module';

@NgModule({
  imports: [
    CommonModule,
    DatePickerModule
  ],
  declarations: [TimeRangeComponent],
  exports: [TimeRangeComponent]
})
export class TimeRangeModule { }
