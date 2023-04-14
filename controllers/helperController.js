const APIFeatures = require("../utils/apiFeatures");
const catchAsync = require("../utils/catchAsync");

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
    const newDoc = await Model.create(req.body);

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
    const features = new APIFeatures(Model.find(), req.query)
      .filter()
      .sort("-createdAt")
      .limitFields()
      .paginate();
    const docs = await features.query;
    const count = await Model.count();
    let page = "1 of 1";
    if (req.query.page && req.query.limit) {
      const pages = Math.ceil(count / req.query.limit);
      page = `${req.query.page} of ${pages}`;
    }
    res.status(200).json({
      status: "OK",
      results: docs.length,
      page: page,
      data: docs,
    });
  });
