-- ============================================================
-- FACILIGYM - NeonDB (PostgreSQL) Database Schema
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Attendance / Check-in Table
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    workout_type VARCHAR(100), -- Ex: "Treino A - Peito"
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_date UNIQUE(user_id, date)
);

-- 3. Workout Routines Table
CREATE TABLE IF NOT EXISTS workout_routines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL, -- Ex: "Treino A - Peito & Tríceps"
    category VARCHAR(50) DEFAULT 'Musculação', -- Ex: Musculação, Cardio, Funcional
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Workout Exercises Table
CREATE TABLE IF NOT EXISTS workout_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    routine_id UUID NOT NULL REFERENCES workout_routines(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL, -- Ex: "Supino Reto"
    sets INT NOT NULL DEFAULT 3,
    reps VARCHAR(50) NOT NULL DEFAULT '10-12',
    weight_kg NUMERIC(5,2) DEFAULT 0,
    order_index INT DEFAULT 0,
    rest_seconds INT DEFAULT 60,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Diet Plans / Meals Table
CREATE TABLE IF NOT EXISTS diet_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- Ex: "Café da Manhã"
    meal_time VARCHAR(20) DEFAULT '08:00',
    calories INT DEFAULT 0,
    protein_g NUMERIC(5,1) DEFAULT 0,
    carbs_g NUMERIC(5,1) DEFAULT 0,
    fats_g NUMERIC(5,1) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Diet Items Table
CREATE TABLE IF NOT EXISTS diet_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diet_plan_id UUID NOT NULL REFERENCES diet_plans(id) ON DELETE CASCADE,
    food_name VARCHAR(150) NOT NULL, -- Ex: "Ovos Mexidos"
    portion VARCHAR(100) NOT NULL, -- Ex: "3 unidades"
    calories INT DEFAULT 0,
    protein_g NUMERIC(5,1) DEFAULT 0,
    carbs_g NUMERIC(5,1) DEFAULT 0,
    fats_g NUMERIC(5,1) DEFAULT 0
);

-- Sample Initial Data Insertion Script
INSERT INTO users (id, name, email, password_hash)
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Atleta FaciliGym', 'atleta@faciligym.app', '$2a$10$abcdefghijklmnopqrstuv')
ON CONFLICT (email) DO NOTHING;
