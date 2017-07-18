import { Component, OnInit, ViewChild, ElementRef, SimpleChanges, OnChanges, Input } from '@angular/core';

declare let Sly;

@Component({
  selector: 'app-metron-table-scroll',
  templateUrl: './metron-table-scroll.component.html',
  styleUrls: ['./metron-table-scroll.component.scss']
})

export class MetronTableScrollComponent implements OnInit, OnChanges {

  @Input('source') source: any[];

  hideScrollBar = false;
  
  frame: any;
  tableNativeElement: any;
  tableTheadTrNativeElement: any;
  @ViewChild('scrollbar') scrollbar: ElementRef;
  @ViewChild('slycmp') slycmp: ElementRef;

  constructor(private elRef: ElementRef) { }

  initSLY() {
    if (this.slycmp.nativeElement.offsetWidth >= this.tableNativeElement.offsetWidth) {
      this.tableNativeElement.querySelector('tbody').style.transform = '';
      this.hideScrollBar = true;
    } else {
      this.hideScrollBar = false;
    }

    if (!this.frame) {
      let options = {
        horizontal: 1,
        itemNav: 'basic',
        smart: 1,
        mouseDragging: true,
        startAt: 0,
        scrollBy: 200,
        speed: 300,
        dragHandle: 1,
        clickBar: 1,
        scrollBar: this.scrollbar.nativeElement,
        scrollSource: this.tableNativeElement,
        slidee: this.tableTheadTrNativeElement
      };
      this.frame = new Sly(this.slycmp.nativeElement, options).init();

      this.frame.on('move',  (eventName) => {
        if (!this.hideScrollBar) {
          this.tableNativeElement.querySelector('tbody').style.transform = this.tableNativeElement.querySelector('thead>tr').style.transform;
        }
      });
    } else {
      this.frame.reload();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes && changes['source']) {
      this.scrollBarShowHide();
      setTimeout(() => { this.initSLY(); }, 500);
    }
  }

  ngOnInit() {
    this.tableNativeElement = this.elRef.nativeElement.querySelector('table');
    this.tableTheadTrNativeElement = this.elRef.nativeElement.querySelector('table>thead>tr')
  }

  scrollBarShowHide() {
    if (this.tableNativeElement && this.slycmp) {

    }
  }

}
