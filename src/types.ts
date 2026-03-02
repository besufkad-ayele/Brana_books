import { Modality } from "@google/genai";

export interface Page {
  text: string;
  imageUrl: string;
  audioUrl?: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  description: string;
  pages: Page[];
}

export interface User {
  role: 'parent' | 'child';
  name: string;
}
