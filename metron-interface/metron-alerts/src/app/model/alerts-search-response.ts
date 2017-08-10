import {Alert, AlertAggregationGroup} from './alert';

export class AlertsSearchResponse {
  total = 0;
  results: Alert[] = [];
  aggregations: AlertAggregationGroup[] = [];
}
