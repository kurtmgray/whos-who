import { Component, OnInit, Output, EventEmitter } from "@angular/core";
import fetchFromSpotify, { request } from "../../services/api";
import { environment } from "src/environments/environment";
import { Router, NavigationExtras } from "@angular/router";

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
  constructor(private router: Router) {}

  genres: String[] = ["House", "Alternative", "J-Rock", "R&B"];
  selectedGenre: String = "";
  authLoading: boolean = false;
  configLoading: boolean = false;
  token: String = "";

  numOfQuestions: number = 5;
  numOfOptionsPerQuestion: number = 2;
  numOfSongsPerQuestion: number = 1;

  @Output() questionsReady: EventEmitter<any[]> = new EventEmitter(); 

  ngOnInit(): void {
    this.authLoading = true;
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
    console.log("Sending request to AWS endpoint");
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

  loadGenres = async (t: any) => {
    this.configLoading = true;
    const response = await fetchFromSpotify({
      token: t,
      endpoint: "recommendations/available-genre-seeds",
    });
    console.log(response);
    this.genres = response.genres;
    this.configLoading = false;
  };

  setGenre(selectedGenre: any) {
    this.selectedGenre = selectedGenre;
    console.log(this.selectedGenre);
    console.log(TOKEN_KEY);
  }

  fetchPlaylistsByGenre = async () => {
    const response = await fetchFromSpotify({
      token: this.token,
      endpoint: "search",
      params: {
        q: this.selectedGenre,
        type: "playlist",
        limit: 1,
      },
    });
    return response.playlists.items.map((item: {id: String}) => item.id);    
  }

  fetchArtistsFromPlaylist = async (playlistIds: String[]) => {
    const artists: any[] = [];
    for (let playlistId of playlistIds) {
      const response = await fetchFromSpotify({
        token: this.token,
        endpoint: `playlists/${playlistId}`,
        params: {
          fields: "tracks.items.track.artists.id",
          limit: 1,
        },
      });
      artists.push(...response.tracks.items.map((item: any) => item.track.artists[0].id))
    }
    console.log(artists)
    return artists;
  }
  
  fetchTracksFromArtists = async (artistIds: String[]) => {
    const artistTracks = []
    for (let artistId of artistIds.slice(0, this.numOfQuestions)) {
      const response = await fetchFromSpotify({
        token: this.token,
        endpoint: `artists/${artistId}/top-tracks`,
        params: {
          limit: 3,
          market: 'US',
        },
      });
      const artistData = {
        name: response.tracks[0].artists[0].name,
        topTracks: response.tracks
          .filter((track: any) => track.id && track.preview_url)
          .map((track: any) => track.id),
        preview: response.tracks
          .filter((track: any) => track.id && track.preview_url)
          .map((track: any) => track.preview_url)
      }
      artistTracks.push(artistData)
    }
    return artistTracks
  }

  createQuestions = async () => { 
    const playlistIds = await this.fetchPlaylistsByGenre()
    const artistIds = await this.fetchArtistsFromPlaylist(playlistIds)
    const artistTracks = await this.fetchTracksFromArtists(artistIds)
    console.log(artistTracks)
    
    const questions = [];
    for (let artistData of artistTracks) {
      const correctArtist = artistData;
      
      // currently on a small number of artists, will pull from larger list later
      const wrongArtists = artistTracks
        .filter(artist => artist.name !== correctArtist.name)
        .sort(() => 0.5 - Math.random())
        .slice(0, this.numOfOptionsPerQuestion - 1);
    
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
    console.log(questions);
      //
    const navigationExtras: NavigationExtras = { state: { questions: questions } };
    this.router.navigate(['/game'], navigationExtras);
    console.log('Attempting to navigate to /game with questions.');
       // 
    return questions;
  }




}
