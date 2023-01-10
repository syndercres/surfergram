CREATE TABLE spots (
  spot_id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  directions TEXT,
  rating NUMERIC
);

INSERT INTO spots (name, directions, rating)
VALUES
  ('Portland Harbour', 'SW,W,S', 7),
  ('Poole Harbour', 'SW,E,SE', 8),
  ('Sandbanks', 'All directions', 9),
  ('Exmouth', 'N,NW,NE', 6),
  ('Bournemouth Beach', 'S,SE', 7.5);

CREATE TABLE comments (
  comment_id SERIAL PRIMARY KEY,
  spot_id INTEGER REFERENCES spots(spot_id),
  name TEXT NOT NULL,
  comment TEXT NOT NULL,
  rating INTEGER
);


INSERT INTO comments (spot_id, name, comment, rating)
VALUES
  (1, 'John', 'This spot is amazing!', 9),
  (1, 'Alice', 'I had a great time here.', 8),
  (1, 'Bob', 'I will definitely come back.', 7),
  (2, 'Alice', 'The directions were a little confusing.', 6),
  (2, 'Bob', 'I got lost a few times.', 5),
  (2, 'John', 'I found it eventually though.', 7),
  (3, 'Bob', 'This spot was breathtaking.', 9),
  (3, 'Alice', 'I highly recommend it.', 8),
  (4, 'John', 'I did not like this spot at all.', 2),
  (4, 'Bob', 'I agree, it was not very enjoyable.', 3);


