const Contact = require('../models/Contact')
const User = require('../models/User')
const asyncHandler = require('express-async-handler')

// @desc Get all contact 
// @route GET /contact
// @access Private
const getAllContacts = asyncHandler(async (req, res) => {
    // Get all contact from MongoDB
    const contacts = await Contact.find().lean()

    // If no contact 
    if (!contacts?.length) {
        return res.status(400).json({ message: 'No contacts found' })
    }

    // Add username to each contact before sending the response 
    // See Promise.all with map() here: https://youtu.be/4lqJBBEpjRE
    // You could also do this with a for...of loop
    const contactWithUser = await Promise.all(contacts.map(async (contacts) => {
        const user = await User.findById(contacts.user).lean().exec()
        return { ...contacts, username: User.username }
    }))

    res.json(contactWithUser)
})

// @desc Create new contact
// @route POST /contact
// @access Private
const createNewContact = asyncHandler(async (req, res) => {
    const { user, name, phone, email, description } = req.body

    // Confirm data
    if (!user || !name ||!phone ||!email || !description) {
        return res.status(400).json({ message: 'All fields are required' })
    }

    // Create and store the new user 
    const contact = await Contact.create({ user, name, phone, email, description })

    if (contact) { // Created 
        return res.status(201).json({ message: 'New contact created' })
    } else {
        return res.status(400).json({ message: 'Invalid contact data received' })
    }

})

// @desc Update a contact
// @route PATCH /contact
// @access Private
const updateContact = asyncHandler(async (req, res) => {
    const { id, user, name, phone, email, description } = req.body

    // Confirm data
    if (!id || !user || !name || !phone || !email || !description) {
        return res.status(400).json({ message: 'All fields are required' })
    }

    // Confirm contact exists to update
    const contact = await Contact.findById(id).exec()

    if (!contact) {
        return res.status(400).json({ message: 'Contact not found' })
    }

    contact.user = user
    contact.name = name
    contact.phone = phone
    contact.email = email
    contact.description = description

    const updatedContact = await contact.save()

    res.json(`'${updatedContact.name}' updated`)
})

// @desc Delete a contact
// @route DELETE /contact
// @access Private
const deleteContact = asyncHandler(async (req, res) => {
    const { id } = req.body

    // Confirm data
    if (!id) {
        return res.status(400).json({ message: 'Contact ID required' })
    }

    // Confirm contact exists to delete 
    const contact = await Contact.findById(id).exec()

    if (!contact) {
        return res.status(400).json({ message: 'Contact not found' })
    }

    const result = await contact.deleteOne()

    const reply = `Contact '${result.name}' with ID ${result._id} deleted`

    res.json(reply)
})

module.exports = {
    getAllContacts,
    createNewContact,
    updateContact,
    deleteContact
}



/*
CONTACT MODEL FOR REFERENCE

const mongoose = require('mongoose')

const contactSchema = new mongoose.Schema(
    {   //reference the user object ID to make this traceable to each individual user who created each unique one
        user: {
            type: mongoose.Schema.Types.ObjectId, //replaces default ID with user ID to track to user
            required: true,
            ref: 'User'
        },
        name: {
            type: String,
            required: true
        },
        phone: {
            type: Number,
            required: true
        },
        email: {
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

module.exports = mongoose.model('Contact', contactSchema)
*/