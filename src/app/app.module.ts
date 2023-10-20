import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { FormsModule } from "@angular/forms";
import { RouterModule, Routes } from "@angular/router";

import { AppComponent } from "./app.component";
import { HomeComponent } from "./home/home.component";
import { GameComponent } from './game/game.component';
import { ResultsComponent } from './results/results.component';
import { HeaderComponent } from './header/header.component';

const routes: Routes = [
  { path: "", component: HomeComponent },
  { path: "game", component: GameComponent },
  { path: "results", component: ResultsComponent },
];

@NgModule({
  declarations: [AppComponent, HomeComponent, GameComponent, ResultsComponent, HeaderComponent],
  imports: [BrowserModule, FormsModule, RouterModule.forRoot(routes)],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
