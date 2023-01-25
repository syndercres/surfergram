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
//--------------------------------------------------------------------------------SPOTS SECTION
//--------------------------------------------------------------------------------Gets all spots from database
app.get("/spots", async (req, res) => {
  const spotList = await client.query("SELECT * FROM spots ORDER BY name");
  res.status(200).json(spotList);
});
//--------------------------------------------------------------------------------GETs a spot by ID
app.get<{spot_id: number}>("/spots/:spot_id", async (req,res)=>{
    const chosenSpot = req.params.spot_id;
    

    const get_spot = await client.query("SELECT * FROM spots WHERE spot_id = $1",[chosenSpot])
 
    res.status(201).json(get_spot)
})
//--------------------------------------------------------------------------------Posts a new spot and adds it to database
app.post("/spots", async (req, res) => {


  const newSpotName = req.body.name;
  const newSpotDirections = req.body.directions;
  const newSpotRating = req.body.rating;
  const newSpotDescription = req.body.description;
  const text =
    "INSERT INTO spots(name, directions, rating, description) VALUES($1, $2, $3, $4) RETURNING *";
  const values = [
    newSpotName,
    newSpotDirections,
    newSpotRating,
    newSpotDescription,
  ];

  const postData = await client.query(text, values);

  res.status(201).json(postData);
});
//--------------------------------------------------------------------------------Updates a spot to average a new rating
app.patch<{spot_id: number}>("/spots/:spot_id", async (req,res)=>{
    const patch_spot = req.params.spot_id;
    const patch_rating = req.body.rating 

    const update_rating = await client.query("UPDATE spots SET rating = ((spots.rating + $1) / 2 )WHERE spot_id = $2",[patch_rating,patch_spot])
 
    res.status(201).json(update_rating)
})



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
//--------------------------------------------------------------------------------DELETES a spot and its comments by spot id
app.delete<{ spot_id: string }>("/spots/:spot_id", async (req, res) => {
  const deleteSpot = req.params.spot_id;
  if (deleteSpot === "not found") {
    res.status(404).json(deleteSpot);
  } else {
    await client.query(`DELETE FROM comments WHERE spot_id = ${deleteSpot}`);
    await client.query(`DELETE FROM spots WHERE spot_id = ${deleteSpot}`);

    res.status(200).json(deleteSpot);
  }
});

//--------------------------------------------------------------------------------COMMENTS SECTION
//--------------------------------------------------------------------------------gets comments from comment table
app.get("/comments", async (req, res) => {
    const commentList = await client.query(
      "SELECT * FROM comments ORDER BY comment_id DESC"
    );
    res.status(200).json(commentList);
  });
//--------------------------------------------------------------------------------gets comments b y spot id
  app.get<{spot_id: number}>("/spots/:spot_id", async (req,res)=>{
    const chosenSpot = req.params.spot_id;
    

    const get_comments = await client.query("SELECT * FROM comments WHERE spot_id = $1",[chosenSpot])
 
    res.status(201).json(get_comments)
})
//--------------------------------------------------------------------------------Adds new comment to comment table
app.post("/comments", async (req, res) => {
  // to be rigorous, ought to handle non-conforming request bodies
  // ... but omitting this as a simplification
  const spotId = req.body.spot_id;
  const newCommentName = req.body.name;
  const newComment = req.body.comment;
  const newCommentRating = req.body.rating;
  const text =
    "INSERT INTO comments(spot_id,name, comment,rating) VALUES($1, $2, $3, $4) RETURNING *";
  const values = [spotId, newCommentName, newComment, newCommentRating];

  const postData = await client.query(text, values);


  res.status(201).json(postData);
});


//--------------------------------------------------------------------------------DELETES a comment by comment id
app.delete<{ comment_id: string }>(
    "/comments/:comment_id",
    async (req, res) => {
      const deleteComment = req.params.comment_id;
      if (deleteComment === "not found") {
        res.status(404).json(deleteComment);
      } else {
        await client.query(
          `DELETE FROM spots WHERE comment_id = ${deleteComment}`
        );
        res.status(200).json(deleteComment);
      }
    }
  );

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
