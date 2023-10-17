import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit {
  constructor(private router: Router) {
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
  score: number = 0;

  ngOnInit(): void {
    this.score = 0; // reset the score for a new game.
  }

  isAnswerSubmitted: boolean = false;
  isAnswerCorrect: boolean = false;
  answeredQuestions: Set<number> = new Set(); // track which questions have been answered.

  submitAnswer() {
    if (!this.isAnswerSubmitted) {
      this.isAnswerCorrect = this.selectedAnswer === this.questions[this.currentQuestionIndex].correctAnswer;

      if (this.isAnswerCorrect) {
        this.score++;
      }

      this.isAnswerSubmitted = true;
    }
  }

  selectAnswer(answer: string) {
    this.selectedAnswer = answer;
  }

  nextQuestion() {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
      this.selectedAnswer = undefined;
      this.isAnswerSubmitted = false;  // Reset for the next question
      this.isAnswerCorrect = false;    // Reset for the next question
    }
  }

  previousQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      if (!this.answeredQuestions.has(this.currentQuestionIndex)) {
        this.selectedAnswer = undefined; // Only reset the selected answer if the previous question hasn't been answered
      }
    }
  }

  finishQuiz() {
    // Logic to handle end of quiz. navigate back to home for now until Results is available.
    this.router.navigate(['/']);
  }
}


