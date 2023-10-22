import { Injectable } from '@angular/core';

interface GameConfig {
  selectedGenre: string | null;
  numOfQuestions: number;
  numOfOptionsPerQuestion: number;
  numOfSongsPerQuestion: number;
}
const DEFAULT_SELECTED_GENRE = null;
const DEFAULT_NUM_OF_QUESTIONS = 5;
const DEFAULT_NUM_OF_OPTIONS_PER_QUESTION = 2;
const DEFAULT_NUM_OF_SONGS_PER_QUESTION = 1;

const DEFAULT_CONFIG: GameConfig = {
  selectedGenre: DEFAULT_SELECTED_GENRE,
  numOfQuestions: DEFAULT_NUM_OF_QUESTIONS,
  numOfOptionsPerQuestion: DEFAULT_NUM_OF_OPTIONS_PER_QUESTION,
  numOfSongsPerQuestion: DEFAULT_NUM_OF_SONGS_PER_QUESTION,
};

@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  constructor() { }

  selectedGenre: string | null = DEFAULT_CONFIG.selectedGenre;
  numOfQuestions: number = DEFAULT_CONFIG.numOfQuestions;
  numOfOptionsPerQuestion: number = DEFAULT_CONFIG.numOfOptionsPerQuestion;
  numOfSongsPerQuestion: number = DEFAULT_CONFIG.numOfSongsPerQuestion;

  saveConfigToLocalStorage = () => {
    const config: GameConfig = {
      selectedGenre: this.selectedGenre,
      numOfQuestions: this.numOfQuestions,
      numOfOptionsPerQuestion: this.numOfOptionsPerQuestion,
      numOfSongsPerQuestion: this.numOfSongsPerQuestion,
    };
    localStorage.setItem("config", JSON.stringify(config));
    console.log("Config saved to local storage");
  }

  // not working
  resetToDefaultConfig = () => {
    // Object.assign(this, DEFAULT_CONFIG);
    this.selectedGenre = DEFAULT_SELECTED_GENRE;
    this.numOfOptionsPerQuestion = DEFAULT_NUM_OF_OPTIONS_PER_QUESTION;
    this.numOfQuestions = DEFAULT_NUM_OF_QUESTIONS;
    this.numOfSongsPerQuestion = DEFAULT_NUM_OF_SONGS_PER_QUESTION;
  }

  loadSavedConfig = () => {
    const storedConfig = localStorage.getItem("config");
    if (storedConfig) {
      console.log("Config found in localstorage");
      const config = JSON.parse(storedConfig);
      this.selectedGenre = config.selectedGenre;
      this.numOfQuestions = config.numOfQuestions;
      this.numOfOptionsPerQuestion = config.numOfOptionsPerQuestion;
      this.numOfSongsPerQuestion = config.numOfSongsPerQuestion;
    }
  }


}
