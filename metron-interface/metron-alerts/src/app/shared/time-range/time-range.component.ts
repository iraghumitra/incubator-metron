/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import * as moment from 'moment/moment';

@Component({
  selector: 'app-time-range',
  templateUrl: './time-range.component.html',
  styleUrls: ['./time-range.component.scss']
})
export class TimeRangeComponent implements OnInit {
  toDate = '';
  fromDate = '';
  toDateStr = '';
  fromDateStr = '';
  selectedTimeRange = 'Today';
  @ViewChild('datePicker') datePicker: ElementRef;

  constructor() { }

  ngOnInit() {
    let message = moment().subtract(7, 'days');
    this.setDate('today');
  }

  selectTimeRange($event, range: string) {
    this.selectedTimeRange = $event.target.textContent.trim();
    this.datePicker.nativeElement.classList.remove('show');

    this.setDate(range);
  }

  setDate(range:string) {
    switch (range) {
      case 'last-7-days':
        this.fromDate = moment().local().format();
        this.toDate = moment().subtract(7, 'days').local().format();
        break;
      case 'last-30-days':
        this.fromDate = moment().local().format();
        this.toDate = moment().subtract(30, 'days').local().format();
        break;
      case 'last-60-days':
        this.fromDate = moment().local().format();
        this.toDate = moment().subtract(60, 'days').local().format();
        break;
      case 'last-90-days':
        this.fromDate = moment().local().format();
        this.toDate = moment().subtract(90, 'days').local().format();
        break;
      case 'last-6-months':
        this.fromDate = moment().local().format();
        this.toDate = moment().subtract(6, 'months').local().format();
        break;
      case 'last-1-year':
        this.fromDate = moment().local().format();
        this.toDate = moment().subtract(1, 'year').local().format();
        break;
      case 'last-2-years':
        this.fromDate = moment().local().format();
        this.toDate = moment().subtract(2, 'years').local().format();
        break;
      case 'last-5-years':
        this.fromDate = moment().local().format();
        this.toDate = moment().subtract(5, 'years').local().format();
        break;
      case 'yesterday':
        this.fromDate = moment().subtract(1, 'days').startOf('day').local().format();
        this.toDate = moment().subtract(1, 'days').endOf('day').local().format();
        break;
      case 'day-before-yesterday':
        this.fromDate = moment().subtract(2, 'days').startOf('day').local().format();
        this.toDate = moment().subtract(2, 'days').endOf('day').local().format();
        break;
      case 'this-day-last-week':
        this.fromDate = moment().subtract(7, 'days').startOf('day').local().format();
        this.toDate = moment().subtract(7, 'days').endOf('day').local().format();
        break;
      case 'previous-week':
        this.fromDate = moment().subtract(1, 'weeks').startOf('week').local().format();
        this.toDate = moment().subtract(1, 'weeks').endOf('week').local().format();
        break;
      case 'previous-month':
        this.fromDate = moment().subtract(1, 'months').startOf('month').local().format();
        this.toDate = moment().subtract(1, 'months').endOf('month').local().format();
        break;
      case 'previous-year':
        this.fromDate = moment().subtract(1, 'years').startOf('year').local().format();
        this.toDate = moment().subtract(1, 'years').endOf('year').local().format();
        break;
      case 'today':
        this.fromDate = moment().startOf('day').local().format();
        this.toDate = moment().endOf('day').local().format();
        break;
      case 'today-so-far':
        this.fromDate = moment().startOf('day').local().format();
        this.toDate = moment().local().format();
        break;
      case 'this-week':
        this.fromDate = moment().startOf('week').local().format();
        this.toDate = moment().endOf('week').local().format();
        break;
      case 'this-week-so-far':
        this.fromDate = moment().startOf('week').local().format();
        this.toDate = moment().local().format();
        break;
      case 'this-month':
        this.fromDate = moment().startOf('month').local().format();
        this.toDate = moment().endOf('month').local().format();
        break;
      case 'this-year':
        this.fromDate = moment().startOf('year').local().format();
        this.toDate = moment().endOf('year').local().format();
        break;
      case 'last-5-minutes':
        this.fromDate = moment().subtract(5, 'minutes').local().format();
        this.toDate = moment().local().format();
        break;
      case 'last-15-minutes':
        this.fromDate = moment().subtract(15, 'minutes').local().format();
        this.toDate = moment().local().format();
        break;
      case 'last-30-minutes':
        this.fromDate = moment().subtract(30, 'minutes').local().format();
        this.toDate = moment().local().format();
        break;
      case 'last-1-hour':
        this.fromDate = moment().subtract(60, 'minutes').local().format();
        this.toDate = moment().local().format();
        break;
      case 'last-3-hours':
        this.fromDate = moment().subtract(3, 'hours').local().format();
        this.toDate = moment().local().format();
        break;
      case 'last-6-hours':
        this.fromDate = moment().subtract(6, 'hours').local().format();
        this.toDate = moment().local().format();
        break;
      case 'last-12-hours':
        this.fromDate = moment().subtract(12, 'hours').local().format();
        this.toDate = moment().local().format();
        break;
      case 'last-24-hours':
        this.fromDate = moment().subtract(24, 'hours').local().format();
        this.toDate = moment().local().format();
        break;
    }

    this.toDateStr = moment(this.toDate).format('D-M-YYYY H:m:s');
    this.fromDateStr = moment(this.fromDate).format('D-M-YYYY H:m:s');
    console.log(this.fromDate, this.toDate);
  }

}
