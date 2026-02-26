-- Rename quality column to sentiment in interactions table
ALTER TABLE interactions RENAME COLUMN quality TO sentiment;
