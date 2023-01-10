import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { Client } from "pg";
import { getEnvVarOrFail } from "./support/envVarUtils";
import { setupDBClientConfig } from "./support/setupDBClientConfig";

//--------------------------------------------------------------------------------Read .env file lines as though they were env vars.
dotenv.config(); 

const dbClientConfig = setupDBClientConfig();
const client = new Client(dbClientConfig);

//--------------------------------------------------------------------------------Configure express routes
const app = express();

app.use(express.json()); //add JSON body parser to each following route handler
app.use(cors()); //add CORS support to each following route handler

app.get("/", async (req, res) => {
  res.json({ msg: "Hello! There's nothing interesting for GET /" });
});

app.get("/health-check", async (req, res) => {
  try {
    //For this to be successful, must connect to db
    await client.query("select now()");
    res.status(200).send("system ok");
  } catch (error) {
    //Recover from error rather than letting system halt
    console.error(error);
    res.status(500).send("An error occurred. Check server logs.");
  }
});
//--------------------------------------------------------------------------------Gets all pastes from database
app.get("/spots", async (req, res) => {
  const pasteList = await client.query(
    "SELECT * FROM spots ORDER BY name"
  );
  res.status(200).json(pasteList);
});
//--------------------------------------------------------------------------------Posts a new paste and adds it to database
app.post("/spots", async (req, res) => {
    // to be rigorous, ought to handle non-conforming request bodies
    // ... but omitting this as a simplification
    const newSpotName = req.body.name;
    const newSpotDirections = req.body.directions;
    const newSpotRating = req.body.rating;
    const newSpotDescription = req.body.description
    const text =  "INSERT INTO spots(name, directions, rating, description) VALUES($1, $2, $3, $4) RETURNING *";
    const values = [newSpotName, newSpotDirections, newSpotRating, newSpotDescription];
  
    const postData = await client.query(text, values);
  
    res.status(201).json(postData);
  });

//--------------------------------------------------------------------------------Deletes all data from database
app.delete("/delete", async (req, res) => {
  try {
    await client.query("DELETE FROM comments");
    await client.query("DELETE FROM spots");

    res.status(200).send("Deleted all!");
  } catch (error) {
    //Recover from error rather than letting system halt
    console.error(error);
    res.status(500).send("An error occurred. Check server logs.");
  }
});
//--------------------------------------------------------------------------------Adds new comment to comment table
app.post("/comments", async (req, res) => {
  // to be rigorous, ought to handle non-conforming request bodies
  // ... but omitting this as a simplification
  const spotId = req.body.spot_id;
  const newCommentName = req.body.name;
  const newComment = req.body.comment;
  const newCommentRating = req.body.rating
  const text =  "INSERT INTO comments(spot_id,name, comment,rating) VALUES($1, $2, $3, $4) RETURNING *";
  const values = [spotId, newCommentName, newComment, newCommentRating];

  const postData = await client.query(text, values);

  res.status(201).json(postData);
});
//--------------------------------------------------------------------------------gets comments from comment table
app.get("/comments", async (req, res) => {
  const commentList = await client.query(
    "SELECT * FROM comments ORDER BY comment_id DESC"
  ); // await client.query('select "id", "name", "text" from paste_bin');
  res.status(200).json(commentList);
  // app.get("/pastes", (req, res) => {
  //   const allSignatures = getAllDbItems();
  //   res.status(200).json(allSignatures);
  // });
});

//--------------------------------------------------------------------------------Connecting to database
connectToDBAndStartListening();

async function connectToDBAndStartListening() {
  console.log("Attempting to connect to db");
  await client.connect();
  console.log("Connected to db!");

  const port = getEnvVarOrFail("PORT");
  app.listen(port, () => {
    console.log(
      `Server started listening for HTTP requests on port ${port}.  Let's go!`
    );
  });
}