-- Create participants table
CREATE TABLE participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nom VARCHAR(255) NOT NULL,
  age INTEGER NOT NULL,
  pseudoinstagram VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create winners table
CREATE TABLE winners (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  participant_id UUID REFERENCES participants(id),
  draw_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create index for faster lookups
CREATE INDEX idx_participants_pseudo ON participants(pseudoinstagram);
CREATE INDEX idx_winners_date ON winners(draw_date); 