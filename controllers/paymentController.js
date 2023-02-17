const Farmer = require("../models/farmerModel");
const Payment = require("../models/paymentModel");
const PurchaseOrder = require("../models/purchaseOrderModel");
const catchAsync = require("../utils/catchAsync");
const { getAll, getOne } = require("./helperController");

exports.getAllPayments = getAll(Payment);
exports.getPayment = getOne(Payment);

exports.changePaymentStatus = catchAsync(async (req, res, next) => {
  const { status, id } = req.params;

  const paymentFound = await Payment.findById(id).select("+purchaseOrderId");

  if (!paymentFound) {
    return res.status(404).json({
      status: "Not found",
      message: "Payment not found",
    });
  }

  if (paymentFound.status !== "Pending") {
    return res.status(500).json({
      status: "Serer error",
      message: "Something went wrong",
    });
  }

  if (status === "Paid") {
    const farmerFound = await Farmer.findById(paymentFound.farmer._id);
    if (!farmerFound) {
      return res.status(500).json({
        status: "Server error",
        message: "Something went wrong",
      });
    }
    await Farmer.findByIdAndUpdate(farmerFound._id, {
      totalPay: farmerFound.totalPay + paymentFound.amount,
      totalBags: farmerFound.totalBags + paymentFound.totalBags,
      totalWeight: farmerFound.totalWeight + paymentFound.totalWeight,
    });
    const purchaseOrderFound = await PurchaseOrder.findById(
      paymentFound.purchaseOrderId
    );
    if (!purchaseOrderFound) {
      return res.status(500).json({
        status: "Server error",
        message: "Something went wrong",
      });
    }

    await PurchaseOrder.findByIdAndUpdate(paymentFound.purchaseOrderId, {
      totalPayments: purchaseOrderFound.totalPayments + 1,
      purchaseOrderId: null,
    });
  }

  const payment = await Payment.findByIdAndUpdate(id, {
    status,
    updatedBy: req.user._id,
  });

  return res.status(200).json({
    status: "OK",
    data: payment,
  });
});
