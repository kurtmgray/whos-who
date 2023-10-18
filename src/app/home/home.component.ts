import { Component, OnInit, Output } from "@angular/core";
import fetchFromSpotify, { request } from "../../services/api";
import { environment } from "src/environments/environment";
import { Router, NavigationExtras } from "@angular/router";

const AUTH_ENDPOINT = "https://accounts.spotify.com/api/token";
const TOKEN_KEY = "whos-who-access-token";
const CLIENT_ID = environment['SPOTIFY_CLIENT_ID'];
const CLIENT_SECRET = environment['SPOTIFY_CLIENT_SECRET'];
const DEFAULT_SELECTED_GENRE = null;
const DEFAULT_NUM_OF_QUESTIONS = 5;
const DEFAULT_NUM_OF_OPTIONS_PER_QUESTION = 2;
const DEFAULT_NUM_OF_SONGS_PER_QUESTION = 1;


type Artist = {
  name: string,
  id: string
}

type ArtistData = {
  name: any;
  topTracks: any;
  preview: any;
}

type Question = {
  text: string;
  options: string[];
  correctAnswer: string;
  preview: string[];
}

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.css"],
})
export class HomeComponent implements OnInit {
  constructor(private router: Router) { }

  @Output() questions: Question[] = [];

  genres: string[] = ["House", "Alternative", "J-Rock", "R&B"];
  selectedGenre: string | null = DEFAULT_SELECTED_GENRE;
  authLoading: boolean = false;
  configLoading: boolean = false;
  token: string = "";

  numOfQuestions: number = DEFAULT_NUM_OF_QUESTIONS;
  numOfOptionsPerQuestion: number = DEFAULT_NUM_OF_OPTIONS_PER_QUESTION
  numOfSongsPerQuestion: number = DEFAULT_NUM_OF_SONGS_PER_QUESTION;

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

  loadGenres = async (t: string) => {
    this.configLoading = true;
    const response = await fetchFromSpotify({
      token: t,
      endpoint: "recommendations/available-genre-seeds",
    });
    console.log(response);
    this.genres = response.genres;
    this.configLoading = false;
  };

  setGenre = async (selectedGenre: string) => {
    this.selectedGenre = selectedGenre;
    const playlistIds = await this.fetchPlaylistsByGenre()
    this.genreArtists = await this.fetchArtistsFromPlaylist(playlistIds)
  }

  fetchPlaylistsByGenre = async () => {
    const response = await fetchFromSpotify({
      token: this.token,
      endpoint: "search",
      params: {
        q: this.selectedGenre,
        type: "playlist",
        limit: 3,
      },
    });
    return response.playlists.items.map((item: { id: string }) => item.id);
  }

  fetchArtistsFromPlaylist = async (playlistIds: string[]) => {
    const artists: Artist[] = [];
    const artistIds = new Set<string>();

    for (let playlistId of playlistIds) {
      const response = await fetchFromSpotify({
        token: this.token,
        endpoint: `playlists/${playlistId}`,
        params: {
          fields: "tracks.items.track.artists",
          limit: 1,
        },
      });

      // Prevent duplicates
      for (const item of response.tracks.items) {
        const artist = {
          name: item.track.artists[0].name,
          id: item.track.artists[0].id
        };

        if (!artistIds.has(artist.id)) {
          artistIds.add(artist.id);
          artists.push(artist);
        }
      }
    }
    return artists.sort(() => 0.5 - Math.random());
  }

  fetchTracksFromArtists = async () => {
    const artistTracks: ArtistData[] = []
    for (let artist of this.genreArtists) {
      const response = await fetchFromSpotify({
        token: this.token,
        endpoint: `artists/${artist.id}/top-tracks`,
        params: {
          limit: 3,
          market: 'US',
        },
      });

      const topTracks: string[] = []
      const preview: string[] = []
      for (let track of response.tracks) {
        if (track.id && track.preview_url) {
          topTracks.push(track.id)
          preview.push(track.preview_url)
        }
      }
      if (preview.length >= this.numOfSongsPerQuestion) {
        const artistData = {
          name: response.tracks[0].artists[0].name,
          topTracks,
          preview
        };
        artistTracks.push(artistData);
      }
      if (artistTracks.length >= this.numOfQuestions) {
        break;
      }
    }
    return artistTracks
  }

  createQuestions = async () => {
    const artistTracks = await this.fetchTracksFromArtists()
    const usedArtist = new Set<string>();
    const questions: Question[] = [];

    for (let artistData of artistTracks) {
      const correctArtist = artistData;

      const wrongArtists = this.genreArtists
        .filter(artist => artist.name !== correctArtist.name && !usedArtist.has(artist.id))
        .sort(() => 0.5 - Math.random())
        .slice(0, this.numOfOptionsPerQuestion - 1)
      
      wrongArtists.forEach(artist => usedArtist.add(artist.id));
  
      const options = [
          ...wrongArtists.map(artist => artist.name),
          correctArtist.name
      ].sort(() => 0.5 - Math.random());

      questions.push({
        text: `Who is the artist of this track?`,
        options,
        correctAnswer: correctArtist.name,
        preview: correctArtist.preview.slice(0, this.numOfSongsPerQuestion)
        
      });
    }
  
    const navigationExtras: NavigationExtras = { state: { questions: questions } };
    this.router.navigate(['/game'], navigationExtras);
    console.log("Questions: ", questions);
    return questions;
  }

  saveConfigToLocalStorage = () => {
    const config = {
      selectedGenre: this.selectedGenre,
      numOfQuestions: this.numOfQuestions,
      numOfOptionsPerQuestion: this.numOfOptionsPerQuestion,
      numOfSongsPerQuestion: this.numOfSongsPerQuestion,
    };
    localStorage.setItem("config", JSON.stringify(config));
    console.log("Config saved to local storage");
  }

  resetToDefaultConfig = () => {
    this.selectedGenre = DEFAULT_SELECTED_GENRE;
    this.numOfQuestions = DEFAULT_NUM_OF_QUESTIONS;
    this.numOfOptionsPerQuestion = DEFAULT_NUM_OF_OPTIONS_PER_QUESTION;
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
