const Community = require("../models/communityModel");

// Create Communities

const create = (req, res, next) => {
  console.log("request body: ", req.body);
  let community = new Community({
    name: req.body.name,
    location: req.body.name,
    communityHead: req.body.communityHead,
    unitPrice: req.body.unitPrice,
  });
  community
    .save()
    .then((response) => {
      res.json({
        message: "Community Created",
        data: response,
      });
    })
    .catch((error) => {
      res.json({
        message: "Community Already Exit!",
      });
    });
};

// show Communities

const read = (req, res, next) => {
  Community.find()
    .then((response) => {
      res.json({
        response,
      });
    })
    .catch((error) => {
      res.json({
        message: "Community Not Found!",
      });
    });
};

// show single Community
const show = (req, res, next) => {
  let communityID = req.body.communityID;
  Farmer.findById(communityID)
    .then((response) => {
      res.json({
        response,
      });
    })
    .catch((error) => {
      res.json({
        message: "Community Not Found!",
      });
    });
};

// Update Community
const updateCommunity = (req, res, next) => {
  let communityID = req.body.communityID;

  let updateCommunityData = {
    name: req.body.name,
    location: req.body.name,
    communityHead: req.body.communityHead,
    unitPrice: req.body.unitPrice,
  };

  Community.findByIdAndUpdate(communityID, updateCommunityData)
    .then(() => {
      res.json({
        message: "Community info Updated!",
      });
    })
    .catch((error) => {
      res.json({
        message: "Community Info not updated",
      });
    });
};

module.exports = {
  create,
  read,
  show,
  updateCommunity,
};
