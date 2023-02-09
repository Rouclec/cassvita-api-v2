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
      status: "Deleted",
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
      status: "Updated",
      data: updatedDoc,
    });
  });

exports.createOne = (Model, params) =>
  catchAsync(async (req, res) => {
    let body = {};
    params.forEach((param) => (body[param] = req.body[param]));
    const newDoc = await Model.create(req.body);

    res.status(201).json({
      status: "Created",
      data: newDoc,
    });
  });

exports.getOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findById(req.params.id);

    if (!doc) {
      return next(
        res.status(404).json({
          status: "Not found",
          message: "Document not found",
        })
      );
    }

    res.status(200).json({
      status: "Success",
      data: doc,
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res) => {
    const docs = await Model.find();

    res.status(200).json({
      status: "Success",
      results: docs.length,
      data: docs,
    });
  });
