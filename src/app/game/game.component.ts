import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit {
  constructor(private router:Router) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation && navigation.extras && navigation.extras.state) {
      this.questions = navigation.extras.state['questions'];
      console.log("Received questions:", this.questions);
      console.log("Navigation object:", navigation);
    }
   }

  questions: any[] = [];
  currentQuestionIndex = 0;
  selectedAnswer?: string;

  ngOnInit(): void {
    
    
  }

  selectAnswer(answer: string) {
    this.selectedAnswer = answer;
    // need to compare the selected answer with the correct one here
  }

  nextQuestion() {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
      this.selectedAnswer = undefined; // reset the selected answer for the new question
    }
  }

  previousQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      this.selectedAnswer = undefined; // reset the selected answer for the previous question
    }
  }
}


