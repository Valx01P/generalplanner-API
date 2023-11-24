const Income = require('../models/Income')
const User = require('../models/User')
const asyncHandler = require('express-async-handler')

// @desc Get all income 
// @route GET /income
// @access Private
const getAllIncome = asyncHandler(async (req, res) => {
    // Get all income from MongoDB
    const income = await Income.find().lean()

    // If no income 
    if (!income?.length) {
        return res.status(400).json({ message: 'No income found' })
    }

    // Add username to each income before sending the response 
    // See Promise.all with map() here: https://youtu.be/4lqJBBEpjRE
    // You could also do this with a for...of loop
    const incomeWithUser = await Promise.all(income.map(async (income) => {
        const user = await User.findById(income.user).lean().exec()
        return { ...income, username: User.username }
    }))

    res.json(incomeWithUser)
})

// @desc Create new income
// @route POST /income
// @access Private
const createNewIncome = asyncHandler(async (req, res) => {
    const { user, amount, title, description } = req.body

    // Confirm data
    if (!user || !amount || !title || !description) {
        return res.status(400).json({ message: 'All fields are required' })
    }

    // Check for duplicate title
    const duplicate = await Income.findOne({ title }).lean().exec()

    if (duplicate) {
        return res.status(409).json({ message: 'Duplicate income title' })
    }

    // Create and store the new user 
    const income = await Income.create({ user, amount, title, description })

    if (income) { // Created 
        return res.status(201).json({ message: 'New income created' })
    } else {
        return res.status(400).json({ message: 'Invalid income data received' })
    }

})

// @desc Update a income
// @route PATCH /income
// @access Private
const updateIncome = asyncHandler(async (req, res) => {
    const { id, user, amount, title, description } = req.body

    // Confirm data
    if (!id || !user || !amount || !title || !description) {
        return res.status(400).json({ message: 'All fields are required' })
    }

    // Confirm income exists to update
    const income = await Income.findById(id).exec()

    if (!income) {
        return res.status(400).json({ message: 'Income not found' })
    }

    // Check for duplicate title
    const duplicate = await Income.findOne({ title }).lean().exec()

    // Allow renaming of the original income 
    if (duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({ message: 'Duplicate income title' })
    }

    income.user = user
    income.amount = amount
    income.title = title
    income.description = description

    const updatedIncome = await income.save()

    res.json(`'${updatedIncome.title}' updated`)
})

// @desc Delete a income
// @route DELETE /income
// @access Private
const deleteIncome = asyncHandler(async (req, res) => {
    const { id } = req.body

    // Confirm data
    if (!id) {
        return res.status(400).json({ message: 'Income ID required' })
    }

    // Confirm income exists to delete 
    const income = await Income.findById(id).exec()

    if (!income) {
        return res.status(400).json({ message: 'Income not found' })
    }

    const result = await income.deleteOne()

    const reply = `Income '${result.title}' with ID ${result._id} deleted`

    res.json(reply)
})

module.exports = {
    getAllIncome,
    createNewIncome,
    updateIncome,
    deleteIncome
}


/*
INCOME MODEL FOR REFERENCE

const mongoose = require('mongoose')

const incomeSchema = new mongoose.Schema(
    {   //reference the user object ID to make this traceable to each individual user who created each unique one
        user: {
            type: mongoose.Schema.Types.ObjectId, //replaces default ID with user ID to track to user
            required: true,
            ref: 'User'
        },
        amount: {
            type: Number,
            required: true
        },
        title: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
)

module.exports = mongoose.model('Income', incomeSchema)
*/