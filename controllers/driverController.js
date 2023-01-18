const Driver = require("../models/driverModel");


//Show the list of Drivers

const index = (req, res, next) => {
    Driver.find()
    .then(response => {
        res.json({
            response
        })
    })
    .catch(error => {
        res.json({
           message: "Driver Not Found" 
        })
    })
}

const show = (req, res, next) => {
    let driverID = req.body.driverID
    Driver.findById(driverID)
    .then(response => {
        res.json({
            response
        })
    })
    .catch(error => {
        res.json({
            message: "Can't find Driver!"
        })
    })

}

// add new Driver

const store = (req, res, next) => {
    let driver = new Driver({
        name: req.body.name,
        phoneNumber: req.body.phoneNumber
    })
    driver.save()
    .then(response => {
        res.json({
            message: "Driver sucessfully added"
        })
    })
    .catch(error => {
        res.json({
            message: "Driver was not added"
        })
    })
}

//Update Driver
const update = (req, res, next) => {
    let driverID = req.body.driverID

    let updateData = {
        name: req.body.name,
        phoneNumber: req.body.phoneNumber
    }

    Driver.findByIdAndUpdate(driverID, {$set: updateData})
    .then(() => {
        res.json({
            message: "Driver successfully updated"
        })
    })
    .catch(error => {
        res.json({
            message: "Driver was not updated"
        })
    })
}

module.exports = {
    index, show, store, update
}
