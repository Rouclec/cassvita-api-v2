const Farmer = require("../models/farmerModel");

//Show the list of Farmer

const index = (req, res, next) => {
    Farmer.find()
    .then(response => {
        res.json({
            response
        })
    })
    .catch(error => {
        res.json({
           message: "Farmer Not Found!" 
        })
    })
}

// show single Farmer
const show = (req, res, next) => {
    let farmerID = req.body.farmerID
    Farmer.findById(farmerID)
    .then(response => {
        res.json({
            response
        })
    })
    .catch(error => {
        res.json({
            message: "Can't find Farmer!"
        })
    })

}

// add new Driver

const store = (req, res, next) => {
    let farmer = new Farmer({
        name: req.body.name,
        phoneNumber: req.body.phoneNumber,
        dateOfBirth: req.body.dateOfBirth,
        community: req.body.community
    })
    driver.save()
    .then(response => {
        res.json({
            message: "Farmer added sucessfully!",
            data: response
        })
    })
    .catch(error => {
        res.json({
            message: "Farmer was not added!"
        })
    })
}

//Update Driver
const update = (req, res, next) => {
    let farmerID = req.body.farmerID

    let updateData = {
        name: req.body.name,
        phoneNumber: req.body.phoneNumber,
        dateOfBirth: req.body.dateOfBirth,
        community: req.body.community
    }

    Driver.findByIdAndUpdate(farmerID, updateData)
    .then(() => {
        res.json({
            message: "Farmer successfully updated"
        })
    })
    .catch(error => {
        res.json({
            message: "Farmer was not updated"
        })
    })
}

module.exports = {
    index, show, store, update
}
