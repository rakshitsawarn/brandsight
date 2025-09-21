import gplay from "google-play-scraper";
import axios from "axios";
import Report from '../models/Report.js'

// const gplay = require("google-play-scraper").default;
// const axios = require("axios");

// const Report = require('../models/Report')

const saveReport = async (reportData) => {
  console.log('Saving report in DB');

  // 1)  Construct a Mongoose document
  const report = new Report(reportData);

  // 2)  Try to save and bubble up errors so the caller can decide
  try {
    const saved = await report.save();   // ← inserts into MongoDB
    console.log('Report saved with id:', saved._id.toString());
  } catch (err) {
    console.error('Failed to save report:', err.message);
    throw err;                           // let caller decide how to respond
  }
};

const getAppIdFromUrl = (brandURL) => {
  try {
    const parsedUrl = new URL(brandURL);
    return new URLSearchParams(parsedUrl.search).get('id');
  } catch (e) {
    return null;
  }
};

const getPlaceIdFromGoogleMapsUrl = (url) => {
  const regex = /0x[a-f0-9]+:0x[a-f0-9]+/i;
  const match = url.match(regex);
  return match ? match[0] : null;
};

const analyzeSentiment = async (uid, brandURLType, title, icon, description, reviews) => {
  try {
      const response = await axios.post("http://localhost:8000/analyze", {uid, brandURLType, title, icon, description, reviews});
      //const response = await axios.post("http://localhost:5001/analyze", {uid, brandURLType, title, icon, description, reviews});

      await saveReport(response.data);
      console.log("Saved report in DB");

      return response.data;
  } catch (error) {
      console.error("Error calling sentiment analysis API:", error.message);
      return 0;
  }
};

const analyze = async (req, res) => {
  console.log("Analyze request recieved by backend");
  const { UID,  brandURL, brandURLType, reviewNumber } = req.body;

  if (brandURLType === "PlayStoreApp") {
    const appID = getAppIdFromUrl(brandURL);

    try {
      const raw = await gplay.app({ appId: appID });
      const about = {
        title: raw.title,
        icon: raw.icon,
        description: raw.description,
      };
      
      //console.log("Title: ",about.title);
      //console.log("Summary: ",about.description); 

      const reviews = await gplay.reviews({
        appId: appID,
        sort: gplay.sort.NEWEST, 
        num: reviewNumber, 
      });
      const formattedReviews = reviews.data.map(review => ({
        user: review.userName,  
        rating: review.score,   
        review: review.text    
      }));
      
      //console.log("Fetched Review: ",formattedReviews);  

      console.log("Scrapped brand description and Reviews.");
      console.log("Sent for analysis");

      const analysisOutput = await analyzeSentiment(UID, brandURLType, about.title, about.icon, about.description, formattedReviews);

      //console.log("Analyzed Output: ",analysisOutput);

      res.json(analysisOutput);

    } catch (err) {
      console.error("Error fetching Google Play reviews:", err.message);
    }
  }

  if (brandURLType === "GoogleMapsPlace") {
    const placeId = getPlaceIdFromGoogleMapsUrl(brandURL);
    console.log("PlaceID: ",placeId);

    res.json("Error fetching Maps Place reviews:");

    // const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
  
    // if (!placeId) {
    //   console.error("Could not extract place ID from URL");
    //   return res.status(400).json({ error: "Invalid Google Maps URL" });
    // }
  
    // try {
    //   const response = await axios.get(
    //     `https://maps.googleapis.com/maps/api/place/details/json`,
    //     {
    //       params: {
    //         place_id: placeId,
    //         key: GOOGLE_MAPS_API_KEY,
    //         fields: "name,rating,review,user_ratings_total,icon,photos,editorial_summary",
    //       },
    //     }
    //   );
  
    //   const data = response.data.result;
  
    //   const about = {
    //     title: data.name,
    //     icon: data.icon || "",
    //     description: data.editorial_summary?.overview || `User ratings: ${data.user_ratings_total}`,
    //   };
  
    //   const formattedReviews = (data.reviews || [])
    //     .slice(0, reviewNumber)
    //     .map((review) => ({
    //       user: review.author_name,
    //       rating: review.rating,
    //       review: review.text,
    //     }));
  
    //   console.log("Scraped Google Maps place description and reviews.");
    //   console.log("Sent for analysis");
  
    //   const analysisOutput = await analyzeSentiment(
    //     UID,
    //     brandURLType,
    //     about.title,
    //     about.icon,
    //     about.description,
    //     formattedReviews
    //   );
  
    //   res.json(analysisOutput);
    // } catch (err) {
    //   console.error("Error fetching Google Maps reviews:", err.message);
    //   res.status(500).json({ error: "Failed to fetch reviews from Google Maps" });
    // }
  }
};

// module.exports = { analyze };
export { analyze };
