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
  questionProgressStyle: any = {};
  incorrectProgressStyle: any = {};
  activeAccordion: number | null = null; 
  activeSampleIndex: number | null = null;
  currentSample: string = '';


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

  toggleAccordion(index: number) {
    console.log("Toggle Accordion called with index:", index);
    
    if (this.questions && this.currentQuestionIndex < this.questions.length) {
        // Safely accessing properties using if statements
        let currentQuestion = this.questions[this.currentQuestionIndex];
        if (currentQuestion && currentQuestion.preview && index < currentQuestion.preview.length) {
            this.activeSampleIndex = index;
            this.currentSample = currentQuestion.preview[index];
        }
    }

    // Apply fade-in/out effect
    let audioContent = document.querySelector('.accordion-content');
    if (audioContent) {  // Ensure audioContent exists before manipulating it
        audioContent.classList.remove('visible');
        setTimeout(() => {
            audioContent?.classList.add('visible');  // Optional chaining is still fine here, but not necessary due to the prior if check
        }, 10);  // short delay to allow for the removal to process first, then add the class back
    }
}

  updateProgressBars() {
    const questionPercentage = ((this.currentQuestionIndex + 1) / this.questions.length * 100);
    const maxIncorrectAnswers = Math.ceil(this.questions.length / 2);
    const incorrectPercentage = (this.incorrectGuesses / maxIncorrectAnswers) * 100;

    this.questionProgressStyle = {
        '--question-fill-color': `conic-gradient(green ${questionPercentage}%, transparent 0%)`
    };

    this.incorrectProgressStyle = {
        '--incorrect-fill-color': `conic-gradient(red ${incorrectPercentage}%, transparent 0%)`
    };
}

  submitAnswer() {
    if (!this.isAnswerSubmitted) {
      this.isAnswerCorrect = this.selectedAnswer === this.questions[this.currentQuestionIndex].correctAnswer;

      if (this.isAnswerCorrect) {
        this.score++;
        this.updateProgressBars();
      } else if (!this.isAnswerCorrect) {
        this.incorrectGuesses++;
        this.updateProgressBars();

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
      this.updateProgressBars();
      this.selectedAnswer = undefined;
      this.isAnswerSubmitted = false;  // Reset for the next question
      this.isAnswerCorrect = false;    // Reset for the next question
    }
  }

  previousQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      this.updateProgressBars();
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
    if (!this.results) { // If results isn't set, set it now
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


