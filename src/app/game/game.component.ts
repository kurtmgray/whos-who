import { Component, OnInit, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { Results } from '../results/results.component';

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
      this.numberOfSamples = navigation.extras.state['numberOfSamples']
      console.log("Received questions:", this.questions);
      console.log("Navigation object:", navigation);
    }
  }
  @ViewChildren('audioControls') audioElements: QueryList<ElementRef<HTMLAudioElement>> | undefined;

  
  questions: any[] = [];
  currentQuestionIndex = 0;
  selectedAnswer?: string;
  score: number = 0;
  incorrectGuesses: number = 0;
  maxWrongAllowed: number = 0;
  gameFinished: boolean = false;
  isAnswerSubmitted: boolean = false;
  isAnswerCorrect: boolean = false;
  answeredQuestions: Set<number> = new Set(); // track which questions have been answered.
  gameOverMessage?: string;
  results: Results | null = null;
  numberOfSamples: number = 3;
  


  ngOnInit(): void {
    if (this.questions.length === 0) {
      this.router.navigate(['/']); 
    }
    this.score = 0; // reset the score for a new game.
    this.incorrectGuesses = 0; // reset incorrect guess counter upon new game.
  }

  onPlay(event: Event) {
    // Pause all other audio elements
    if (this.audioElements) {
      this.audioElements.forEach(audioRef => {
        const audio: HTMLAudioElement = audioRef.nativeElement;
        if (audio !== event.target) {
            audio.pause();
        }
      })
    }
  }

  submitAnswer() {
    if (!this.isAnswerSubmitted) {
      this.isAnswerCorrect = this.selectedAnswer === this.questions[this.currentQuestionIndex].correctAnswer;
  
      if (this.isAnswerCorrect) {
        this.score++;
      } else if (!this.isAnswerCorrect) {
        this.incorrectGuesses++;
  
        // Check here if the maximum incorrect threshold has been reached
        if (this.maxIncorrectReached()) {
          this.gameFinished = true; // Marking the game as finished
          this.gameOverMessage = "You got too many wrong!";
          this.results = {
            score: this.score,
            total: this.questions.length, // total questions in the quiz
            gameOverMessage: this.gameOverMessage,
            questionReached: this.currentQuestionIndex + 1
          };
          this.finishQuiz(); // If you want to finish the quiz when the threshold is reached.
          return; // This will exit the function early and the remaining logic won't execute.
        }
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

  getMaxIncorrectGuesses(): number {
    return Math.ceil(this.questions.length / 2);
  }

  maxIncorrectReached(): boolean {
    return this.incorrectGuesses >= this.getMaxIncorrectGuesses();
  }

  finishQuiz() {
    // Logic to handle end of quiz. navigate back to home for now until Results is available.
    // const navigationExtras: NavigationExtras = { state: { results: {score: this.score, total: this.questions.length} } };
    // this.router.navigate(['/results'], navigationExtras);

    this.gameFinished = true;
    if(!this.results) { // If results isn't set, set it now
      this.results = {
        score: this.score,
        total: this.questions.length
      };
    }
  }

  handleResultsClosed() {
    this.gameFinished = false;
  }
}


