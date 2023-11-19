import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { GameComponent } from './game.component';

describe('GameComponent', () => {
  let component: GameComponent;
  let fixture: ComponentFixture<GameComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GameComponent ],
      imports: [ RouterTestingModule.withRoutes([]) ],
      providers: [
        {
          provide: Router,
          useValue: {
            getCurrentNavigation: () => ({
              extras: {
                state: {
                  questions: ['Question 1', 'Question 2'], // mock questions
                  numberOfSamples: 3
                }
              }
            })
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have an initial score of 0', () => {
    expect(component.score).toBe(0)
  })

  it('should have an initial incorrectGuesses of 0', () => {
    expect(component.incorrectGuesses).toBe(0)
  })

  it('should should have questions.length = 2', () => {
    expect(component.questions.length).toBe(2)
  })

  it('should have a numberOfSamples = 3', () => {
    expect(component.numberOfSamples).toBe(3)
  })

});
