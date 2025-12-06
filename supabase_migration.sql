-- Avatar Farm Database Migration - Safe Table Creation
-- Run this in Supabase SQL Editor to create the required tables
-- This contains only CREATE statements - completely safe and non-destructive

-- Create the simulations table
CREATE TABLE IF NOT EXISTS simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- Optional: For future account management
  scenario JSONB NOT NULL,
  messages JSONB NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_simulations_completed_at ON simulations(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_simulations_user_id ON simulations(user_id) WHERE user_id IS NOT NULL;

