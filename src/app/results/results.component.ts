import { Component, OnInit, Output, Input, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';

export type Results = {
  score: number,
  total: number,
  gameOverMessage?: string, // to store the "You got too many wrong" message
  questionReached?: number; // to change 2nd number in the results message based on what Q # they reached.
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
