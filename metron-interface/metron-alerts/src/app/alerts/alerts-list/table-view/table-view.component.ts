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

import { Component, OnInit, OnChanges, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import {Router} from '@angular/router';

import {Pagination} from '../../../model/pagination';
import {SortEvent} from '../../../shared/metron-table/metron-table.directive';
import {ColumnMetadata} from '../../../model/column-metadata';
import {Alert} from '../../../model/alert';

@Component({
  selector: 'app-table-view',
  templateUrl: './table-view.component.html',
  styleUrls: ['./table-view.component.scss']
})
export class TableViewComponent implements OnInit, OnChanges {

  @Input() alerts = [];
  @Input() pagingData = new Pagination();
  @Input() selectedAlerts: Alert[] = [];
  @Input() alertsColumnsToDisplay: ColumnMetadata[] = [];

  @Output() onResize = new EventEmitter<void>();
  @Output() onSort = new EventEmitter<SortEvent>();
  @Output() onPageChange = new EventEmitter<void>();
  @Output() onAddFilter = new EventEmitter<{}>();
  @Output() selectedAlertsChange = new EventEmitter< Alert[]>();
  @Output() beforeShowDetails = new EventEmitter<void>();

  constructor(private router: Router) { }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedAlerts'] && changes['selectedAlerts'].currentValue) {
      console.log(this.selectedAlerts);
    }
  }

  getValue(alert: Alert, column: ColumnMetadata, formatData: boolean) {
    let returnValue = '';
    try {
      switch (column.name) {
        case 'id':
          returnValue = alert[column.name];
          break;
        case 'alert_status':
          returnValue = 'NEW';
          break;
        default:
          returnValue = alert.source[column.name];
          break;
      }
    } catch (e) {}

    if (formatData) {
      returnValue = this.formatValue(column, returnValue);
    }

    return returnValue;
  }

  formatValue(column: ColumnMetadata, returnValue: string) {
    try {
      if (column.name.endsWith(':ts') || column.name.endsWith('timestamp')) {
        returnValue = new Date(parseInt(returnValue, 10)).toISOString().replace('T', ' ').slice(0, 19);
      }
    } catch (e) {}

    return returnValue;
  }

  pageChange() {
    this.onPageChange.emit();
  }

  selectRow($event, alert: Alert) {
    if ($event.target.checked) {
      this.selectedAlerts.push(alert);
    } else {
      this.selectedAlerts.splice(this.selectedAlerts.indexOf(alert), 1);
    }

    this.selectedAlertsChange.emit(this.selectedAlerts);
  }
  
  sort(sortEvent: SortEvent) {
    this.onSort.emit(sortEvent);
  }

  selectAllRows($event) {
    this.selectedAlerts = [];
    if ($event.target.checked) {
      this.selectedAlerts = this.alerts;
    }

    this.selectedAlertsChange.emit(this.selectedAlerts);
  }

  resize() {
    this.onResize.emit();
  }

  addFilter(field: string, value: string) {
    let map = {};
    map[field] = value;
    this.onAddFilter.emit(map);
  }

  showDetails($event, alert: Alert) {
    if ($event.target.type !== 'checkbox' && $event.target.parentElement.firstChild.type !== 'checkbox' && $event.target.nodeName !== 'A') {
      this.selectedAlerts = [];
      this.selectedAlerts = [alert];
      this.beforeShowDetails.emit();
      this.selectedAlertsChange.emit(this.selectedAlerts);
      this.router.navigateByUrl('/alerts-list(dialog:details/' + alert.source['source:type'] + '/' + alert.source.guid + ')');
    }
  }

  showConfigureTable() {
    this.beforeShowDetails.emit();
    this.router.navigateByUrl('/alerts-list(dialog:configure-table)');
  }
}
