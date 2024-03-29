const { default: mongoose } = require("mongoose");
const Farmer = require("../models/farmerModel");
const APIFeatures = require("../utils/apiFeatures");
const catchAsync = require("../utils/catchAsync");
const User = require("../models/userModel");
const axios = require("axios");

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findById(req.params.id);

    if (!doc) {
      return next(
        res.status(404).json({
          status: "Not Found",
          message: `Document with id ${req.params.id} not found`,
        })
      );
    }
    await Model.findByIdAndDelete(req.params.id);
    res.status(204).json({
      status: "OK",
      message: "Document deleted successfully!",
    });
  });

exports.updateOne = (Model, params) =>
  catchAsync(async (req, res) => {
    let body = {};
    params.forEach((param) => (body[param] = req.body[param] || null));
    const updatedDoc = await Model.findByIdAndUpdate(req.params.id, body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({
      status: "OK",
      data: updatedDoc,
    });
  });

exports.createOne = (Model, params) =>
  catchAsync(async (req, res) => {
    let body = {
      createdBy: req.user._id,
    };
    params.forEach((param) => (body[param] = req.body[param]));
    const newDoc = await Model.create(body);

    res.status(201).json({
      status: "OK",
      data: newDoc,
    });
  });

exports.getOne = (Model, populateOptions, selectOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);

    if (populateOptions) query = query.populate(populateOptions);
    if (selectOptions) query = query.select(selectOptions);

    const doc = await query;

    if (!doc) {
      return next(
        res.status(404).json({
          status: "Not found",
          message: "Document not found",
        })
      );
    }

    res.status(200).json({
      status: "OK",
      data: doc,
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res) => {
    const features = new APIFeatures(
      Model.find({ removed: { $ne: true } }),
      req.query
    )
      .filter()
      .sort("-createdAt")
      .limitFields()
      .paginate();

    const docs = await features.query;
    let pageQuery = features.queryString.page;
    let limitQuery = features.queryString.limit;
    let newQueryString = features.queryString;
    delete newQueryString.sort;
    delete newQueryString.page;
    delete newQueryString.limit;
    newQueryString = {
      ...newQueryString,
      removed: { $ne: true },
    };
    const count = await Model.count(newQueryString);
    let page = "1 of 1";
    if (pageQuery && limitQuery) {
      const pages = Math.ceil(count / limitQuery);
      page = `${pageQuery} of ${pages}`;
    }
    res.status(200).json({
      status: "OK",
      results: count,
      page: page,
      data: docs,
    });
  });

exports.search = (Model) =>
  catchAsync(async (req, res, next) => {
    let docs = [];
    let count = 0;

    let page = "1 of 1";

    if (req.query.page && req.query.limit) {
      let paginate = req.query.page - 1;
      limit = req.query.limit;
      count = await Model.count({
        $text: { $search: req.params.searchString },
      });
      const pages = Math.ceil(count / limit);
      page = `${paginate + 1} of ${pages}`;
      docs = await Model.find({
        $text: { $search: req.params.searchString },
      })
        .skip(paginate)
        .limit(limit);
    } else {
      docs = await Model.find({
        $text: { $search: req.params.searchString },
      });
      count = docs.length;
    }

    if (docs.length === 0) {
      const farmer = await Farmer.find({
        $text: { $search: req.params.searchString },
      });

      if (farmer.length > 0) {
        const farmerId = mongoose.Types.ObjectId(farmer[0]._id);
        if (req.query.page && req.query.limit) {
          const paginate = req.query.page - 1;
          const limit = req.query.limit;
          count = await Model.count({ farmer: farmerId });
          const tempPages = Math.ceil(count / limit);
          page = `page ${paginate + 1} of ${tempPages}`;
          docs = await Model.find({
            farmer: farmerId,
          })
            .skip(paginate)
            .limit(limit);
        } else {
          docs = await Model.find({
            farmer: farmerId,
          });
          count = docs.length;
        }
      }
    }

    return next(
      res.status(200).json({
        status: "OK",
        results: count,
        page: page,
        data: docs,
      })
    );
  });

exports.genericSearch = () =>
  catchAsync(async (req, res, next) => {
    const { query } = req.params;
    const regex = new RegExp(query, "i"); // Case-insensitive regex

    let models = mongoose.modelNames();

    models = models.filter(
      (model) =>
        model.toLowerCase() !== "role" &&
        model.toLowerCase() !== "driver" &&
        model.toLowerCase() !== "purchaseorder"
    );

    let searchResults = [];

    if (req.params?.model) {
      const modelName = models.find(
        (model) => model.toLowerCase() === req.params.model.toLowerCase()
      );
      const Model = mongoose.model(modelName);

      let fields = Object.keys(Model.schema.paths).filter(
        (field) =>
          field.toString() !== "__v" &&
          field.toString() !== "_id" &&
          !field.toLowerCase().includes("created") &&
          !field.toLowerCase().includes("date") &&
          !field.toLowerCase().includes("number") &&
          !field.toLowerCase().includes("total") &&
          !field.toLowerCase().includes("amount") &&
          !field.toLowerCase().includes("price") &&
          !field.toLowerCase().includes("weight") &&
          !field.toLowerCase().includes("bag") &&
          !field.toLowerCase().includes("updated") &&
          !field.toLowerCase().includes("taxid") &&
          !field.toLowerCase().includes("postalcode") &&
          !field.toLowerCase().includes("gender") &&
          !field.toLowerCase().includes("farmsize") &&
          !field.toLowerCase().includes("averageinvestment") &&
          !field.toLowerCase().includes("profilePic") &&
          !field.toLowerCase().includes("bdc") &&
          !field.toLowerCase().includes("active") &&
          !field.toLowerCase().includes("quantity") &&
          !field.toLowerCase().includes("receipt") &&
          !field.toLowerCase().includes("recent") &&
          !field.toLowerCase().includes("role") &&
          field.toString() !== "lastLogin" &&
          field.toString() !== "resetToken" &&
          field.toString() !== "resetTokenExpiration" &&
          !field.toLowerCase().includes("password") &&
          field.toString() !== "removed"
      );

      if (modelName.toLowerCase() === "farmer") {
        fields = fields.filter((field) => field.toLowerCase() !== "community");
      }
      if (modelName.toLowerCase() === "procurement") {
        fields = fields.filter(
          (field) => field.toLowerCase() !== "purchaseorder"
        );
      }
      if (modelName.toLowerCase() === "payment") {
        fields = fields.filter(
          (field) =>
            field.toLowerCase() !== "purchaseorder" &&
            field.toLowerCase() !== "procurement" &&
            field.toLowerCase() !== "farmer"
        );
      }
      if (modelName.toLowerCase() === "farmer") {
        fields = fields.filter((field) => field.toLowerCase() !== "community");
      }

      const conditions = fields.map((field) => ({
        [field]: regex,
      }));

      const result = await Model.find({ $or: conditions }).exec();
      searchResults.push(...result);
    } else {
      for (const modelName of models) {
        const Model = mongoose.model(modelName);

        let fields = Object.keys(Model.schema.paths).filter(
          (field) =>
            field.toString() !== "__v" &&
            field.toString() !== "_id" &&
            !field.toLowerCase().includes("created") &&
            !field.toLowerCase().includes("date") &&
            !field.toLowerCase().includes("number") &&
            !field.toLowerCase().includes("total") &&
            !field.toLowerCase().includes("amount") &&
            !field.toLowerCase().includes("price") &&
            !field.toLowerCase().includes("weight") &&
            !field.toLowerCase().includes("bag") &&
            !field.toLowerCase().includes("updated") &&
            !field.toLowerCase().includes("id") &&
            !field.toLowerCase().includes("postalcode") &&
            !field.toLowerCase().includes("gender") &&
            !field.toLowerCase().includes("farmsize") &&
            !field.toLowerCase().includes("averageinvestment") &&
            !field.toLowerCase().includes("profilepic") &&
            !field.toLowerCase().includes("bdc") &&
            !field.toLowerCase().includes("active") &&
            !field.toLowerCase().includes("quantity") &&
            !field.toLowerCase().includes("receipt") &&
            !field.toLowerCase().includes("recent") &&
            !field.toLowerCase().includes("role") &&
            !field.toLowerCase().includes("status") &&
            field.toString() !== "lastLogin" &&
            field.toString() !== "resetToken" &&
            field.toString() !== "resetTokenExpiration" &&
            !field.toLowerCase().includes("password") &&
            field.toString() !== "removed"
        );

        if (modelName.toLowerCase() === "farmer") {
          fields = fields.filter(
            (field) => field.toLowerCase() !== "community"
          );
        }
        if (modelName.toLowerCase() === "procurement") {
          fields = fields.filter(
            (field) => field.toLowerCase() !== "purchaseorder"
          );
        }
        if (modelName.toLowerCase() === "payment") {
          fields = fields.filter(
            (field) =>
              field.toLowerCase() !== "purchaseorder" &&
              field.toLowerCase() !== "procurement" &&
              field.toLowerCase() !== "farmer"
          );
        }
        if (modelName.toLowerCase() === "farmer") {
          fields = fields.filter(
            (field) => field.toLowerCase() !== "community"
          );
        }

        const conditions = fields.map((field) => ({
          [field]: regex,
        }));

        const result = await Model.find({ $or: conditions }).exec();

        const updatedResults = result.map((element) => ({
          ...element.toObject(),
          model: modelName,
        }));

        searchResults.push(...updatedResults);
      }
    }

    return next(
      res.status(200).json({
        status: "OK",
        results: searchResults.length,
        data: searchResults,
      })
    );
  });

exports.getTokenFromCampay = async (creds) => {
  try {
    const response = await axios.post(
      `${process.env.CAMPAY_BASE_URL_DEMO}/token/`,
      creds,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status === 200) {
      return response.data;
    }
    return response.data;
  } catch (error) {
    return error;
  }
};
