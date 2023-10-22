import { Component, OnInit, Output } from "@angular/core";
import { request } from "../../services/api";
import { environment } from "src/environments/environment";
import { Router, NavigationExtras } from "@angular/router";
import { ConfigService } from "src/services/config.service";
import { GameService } from "src/services/game.service";

const AUTH_ENDPOINT = "https://accounts.spotify.com/api/token";
const TOKEN_KEY = "whos-who-access-token";
const CLIENT_ID = environment['SPOTIFY_CLIENT_ID'];
const CLIENT_SECRET = environment['SPOTIFY_CLIENT_SECRET'];

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.css"],
})
export class HomeComponent implements OnInit {
  constructor(
    private router: Router, 
    private configService: ConfigService, 
    private gameService: GameService
  ) {}

  @Output() questions: Question[] = [];

  genres: string[] = ["House", "Alternative", "J-Rock", "R&B"];
  selectedGenre: string | null = this.configService.selectedGenre;
  authLoading: boolean = false;
  configLoading: boolean = false;
  token: string = "";
  errorMessage: string | null = null;

  numOfQuestions: number = this.configService.numOfQuestions;
  numOfOptionsPerQuestion: number = this.configService.numOfOptionsPerQuestion
  numOfSongsPerQuestion: number = this.configService.numOfSongsPerQuestion;

  genreArtists: Artist[] = [];

  ngOnInit(): void {
    this.authLoading = true;
    
    this.loadSavedConfig()
    
    const storedTokenString = localStorage.getItem(TOKEN_KEY);
    if (storedTokenString) {
      const storedToken = JSON.parse(storedTokenString);
      if (storedToken.expiration > Date.now()) {
        console.log("Token found in localstorage");
        this.authLoading = false;
        this.token = storedToken.value;
        this.loadGenres(storedToken.value);
        return;
      }
    }
    request(AUTH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`
    }
    ).then(({ access_token, expires_in }) => {
      const newToken = {
        value: access_token,
        expiration: Date.now() + (expires_in - 20) * 1000,
      };
      localStorage.setItem(TOKEN_KEY, JSON.stringify(newToken));
      this.authLoading = false;
      this.token = newToken.value;
      this.loadGenres(newToken.value);
    });
  }

  loadCurrentConfigFromService() {
    this.configService.loadSavedConfig();
    this.selectedGenre = this.configService.selectedGenre;
    this.numOfQuestions = this.configService.numOfQuestions;
    this.numOfOptionsPerQuestion = this.configService.numOfOptionsPerQuestion;
    this.numOfSongsPerQuestion = this.configService.numOfSongsPerQuestion;
}

  loadGenres = async (t: string) => {
    this.configLoading = true;
    this.genres = await this.gameService.fetchGenres(t);
    this.configLoading = false;
  };

  setGenre = async (selectedGenre: string) => {
    this.configLoading = true;
    this.selectedGenre = selectedGenre;
    this.configService.selectedGenre = selectedGenre;
    this.errorMessage = null;
    this.configLoading = false;
  }

  setNumOfQuestions = (numOfQuestions: number) => {
    this.numOfQuestions = numOfQuestions;
    this.configService.numOfQuestions = numOfQuestions;
  }

  setNumOfSongsPerQuestion = (numOfSongsPerQuestion: number) => {
    this.numOfSongsPerQuestion = numOfSongsPerQuestion;
    this.configService.numOfSongsPerQuestion = numOfSongsPerQuestion;
  }

  setNumOfOptionsPerQuestion = (numOfOptionsPerQuestion: number) => {
    this.numOfOptionsPerQuestion = numOfOptionsPerQuestion;
    this.configService.numOfOptionsPerQuestion = numOfOptionsPerQuestion;
  }

  createQuestions = async () => {
    this.configLoading = true;
    const playlistIds = await this.gameService.fetchPlaylistsByGenre(this.token, this.selectedGenre!)
    console.log(`Playlist IDs from ${this.selectedGenre}: `, playlistIds)
    this.genreArtists = await this.gameService.fetchArtistsFromPlaylist(this.token, playlistIds)
    console.log(`Artists from playlists: `, this.genreArtists)
    const artistTracks = await this.gameService.fetchTracksFromArtists(this.token, this.genreArtists, this.numOfSongsPerQuestion, this.numOfQuestions)
    console.log(`Correct artist tracks: `, artistTracks)
    const usedArtist = new Set<string>();
    const questions: Question[] = [];
    
    for (let artistData of artistTracks) {
      const correctArtistId = this.genreArtists.find(artist => artist.name === artistData.name)?.id;
      const correctArtist = correctArtistId 
        ? { 
          ...artistData, 
          img: await this.gameService.fetchArtistImage(this.token, correctArtistId) || artistData.img
        }
        : artistData;

      const wrongArtists = this.genreArtists
          .filter(artist => artist.name !== correctArtist.name && !usedArtist.has(artist.id))
          .sort(() => 0.5 - Math.random())
          .slice(0, this.numOfOptionsPerQuestion - 1);

      const wrongArtistImagesPromises = wrongArtists.map(artist => this.gameService.fetchArtistImage(this.token, artist.id));

      const wrongArtistImages = await Promise.all(wrongArtistImagesPromises);

      const options: Option[] = [
          { 
            name: correctArtist.name, 
            img: correctArtist.img,

          },
          ...wrongArtists.map((artist, index) => {
              return { name: artist.name, img: wrongArtistImages[index] };
          })
      ];

      questions.push({
          text: `Who is the artist of this track?`,
          options,
          correctAnswer: correctArtist.name,
          preview: correctArtist.previews.slice(0, this.numOfSongsPerQuestion)
      });

      wrongArtists.forEach(artist => usedArtist.add(artist.id));
  }
  
    const navigationExtras: NavigationExtras = 
    { state: { questions: questions, numberOfSamples: this.numOfSongsPerQuestion } };
    
    if (this.numOfQuestions > questions.length) {
      this.errorMessage = "Not enough songs to create questions. Please select a different genre."
      return
    }
    console.log("Questions to send to Game: ", questions);
    this.router.navigate(['/game'], navigationExtras);
    this.configLoading = false;
  }

  resetToDefaultConfig = () => {
    this.configService.resetToDefaultConfig();
    this.loadCurrentConfigFromService();

  }

  saveConfigToLocalStorage = () => {
    this.configService.saveConfigToLocalStorage();
    this.loadCurrentConfigFromService()
  }

  loadSavedConfig = () => {
    this.configService.loadSavedConfig();
    this.loadCurrentConfigFromService()
  }
}

