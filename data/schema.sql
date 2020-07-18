DROP TABLE IF EXISTS movetable;
CREATE TABLE movetable(
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    poster_path VARCHAR(255),
    vote_count INT,
    overview TEXT
);