import { Component, OnInit, Input, EventEmitter, Output, OnChanges, SimpleChanges } from '@angular/core';
import {AlertAggregationGroup, AlertAggregation} from '../../model/alert';
import { DragulaService } from 'ng2-dragula/ng2-dragula';


@Component({
  selector: 'app-group-by',
  templateUrl: './group-by.component.html',
  styleUrls: ['./group-by.component.scss']
})
export class GroupByComponent implements OnInit, OnChanges {

  backgroundColor = '#0F4450';
  border = '1px solid #1B596C';

  @Input() aggregations: AlertAggregationGroup[] = [];
  @Input() aggregationsWithValues: AlertAggregationGroup[] = [];
  @Output() aggregationsChange = new EventEmitter<AlertAggregationGroup[]>();
  
  constructor(private dragulaService: DragulaService) { }

  ngOnInit() {
    this.setTransitStyle();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes && changes['aggregationsWithValues'] && changes['aggregationsWithValues'].currentValue) {
      // let valuesFlatArray: AlertAggregation[] = [];
      // let values: AlertAggregationGroup[] = changes['aggregationsWithValues'].currentValue;
      // values.forEach(aggrArray => {
      //   valuesFlatArray.push(...aggrArray.aggregations);
      // });
      //
      // valuesFlatArray.forEach(aggr1 => {
      //   this.aggregations.filter(aggr2 => aggr2.key === aggr1.key)[0].count = aggr1.count;
      // });
    }
  }

  selectGroup(group: AlertAggregationGroup) {
    group.enabled = !group.enabled;
    this.aggregationsChange.emit(this.aggregations);
  }

  private setTransitStyle() {
    this.dragulaService.drag.subscribe(value => {
      value[1].style.background = this.backgroundColor;
      value[1].style.border = this.border;
      value[1].style.textAlign = 'Center';

      value[1].querySelector('.count').style.fontSize = '20px';
      value[1].querySelector('.name').style.fontSize = '12px';

    });

    this.dragulaService.dragend.subscribe(value => {
      value[1].style.background = '';
      value[1].style.border = '';
      value[1].style.textAlign = '';
    })
  }

  unGroup() {
    this.aggregations.map(aggregation => aggregation.enabled = false);
  }
}
