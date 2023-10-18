import { Component, OnInit, Output, Input, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';

type Results = {
  score: number,
  total: number
}

@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.css']
})
export class ResultsComponent implements OnInit {

  constructor() {}
  // constructor(private router: Router) {
  //   const navigation = this.router.getCurrentNavigation();
  //   if (navigation && navigation.extras && navigation.extras.state) {
  //     this.results = navigation.extras.state['results'];
  //     console.log("Received results:", this.results);
  //   }
  // }

  @Output() closeResults: EventEmitter<void> = new EventEmitter();

  @Input() results: Results | null = null; 
  close() {
    this.closeResults.emit();
  }

  ngOnInit(): void {
  }

}
