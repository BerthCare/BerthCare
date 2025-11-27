/**
 * Data models for the BerthCare mobile application
 *
 * This file contains TypeScript type definitions for core data models
 * including Visit, Client, and other domain entities.
 */

// Placeholder for data models - to be implemented during feature development
export interface Visit {
  id: string;
  clientId: string;
  caregiverId: string;
  scheduledAt: string; // ISO timestamp
  status: 'scheduled' | 'in_progress' | 'completed' | 'canceled';
  notes?: string;
}

export interface Client {
  id: string;
  fullName: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface Caregiver {
  id: string;
  fullName: string;
  role?: string;
  phone?: string;
}
