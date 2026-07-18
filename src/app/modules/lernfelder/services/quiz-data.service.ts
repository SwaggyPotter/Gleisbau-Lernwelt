import { Injectable } from '@angular/core';
import { QuizQuestion, Topic } from '../models/quiz.model';

/**
 * Quiz-Daten-Service
 * 
 * Alle Inhalte wurden neu aus öffentlichen Quellen recherchiert.
 * Keine Inhalte aus internen DB-Unterlagen übernommen.
 */
@Injectable({
  providedIn: 'root'
})
export class QuizDataService {

  // Themen-Katalog
  private topics: Topic[] = [
    {
      number: 1,
      title: 'Gleisbau-Grundlagen',
      description: 'Aufbau Eisenbahngleis, Oberbau, Unterbau, Bestandteile und Aufgaben des Gleisbauers',
      searchTerms: ['Aufbau Eisenbahngleis', 'Oberbau', 'Unterbau', 'Schiene', 'Schwelle', 'Bettung'],
      questionCount: 8
    },
    {
      number: 2,
      title: 'Spurweite und Gleisgeometrie',
      description: 'EBO Spurweite, Regelspur 1435 mm, Gleisbogen, Überhöhung',
      searchTerms: ['EBO Spurweite', 'Regelspur 1435 mm', 'Gleisbogen', 'Überhöhung'],
      questionCount: 8
    },
    {
      number: 3,
      title: 'Schienen',
      description: 'Schiene Aufbau, Profil, Wärmeausdehnung, verschweißtes Gleis',
      searchTerms: ['Eisenbahnschiene', 'Schienenprofil', 'Wärmeausdehnung