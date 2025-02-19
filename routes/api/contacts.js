const express = require("express");
const Joi = require("joi");
const auth = require('../../middlewares/auth')

const contacts = require("../../model/contacts");

const contactsRouter = express.Router();

const addSchema = Joi.object({
  name: Joi.string(),
  email: Joi.string().email({
    minDomainSegments: 2,
    tlds: { allow: ["net", "com"] },
  }),
  phone: Joi.string().pattern(/^\d+$/),
  favorite: Joi.boolean(),
});

const addSchemaFavorite = Joi.object({
  favorite: Joi.boolean().required(),
});

const addSchemaReq = Joi.object({
  name: Joi.string().required(),
  email: Joi.string()
    .email({
      minDomainSegments: 2,
      tlds: { allow: ["net", "com"] },
    })
    .required(),
  phone: Joi.string()
    .pattern(/^[0-9]+$/, "numbers")
    .required(),
  favorite: Joi.boolean(),
});

contactsRouter.get("/", auth, async (req, res, next) => {
  try {
    const owner = req.user._id
    const allContacts = await contacts.listContacts(owner);
    res.json(allContacts);
  } catch (err) {
    next(err);
  }
});

contactsRouter.get("/:contactId", auth, async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const owner = req.user._id
    const contact = await contacts.getContactById(contactId, owner);
    if (!contact) {
        return res.status(404).json({
        status: '404 found',
        code: 404,
        message: 'Not Found',
      });
    }
    res.json(contact);
  } catch (err) {
    res.status(404).json({
      status: '404 found',
      code: 404,
      message: 'Not Found',
    });
    next(err);
  }
});

contactsRouter.post("/", auth, async (req, res, next) => {
  try {
    const { error } = addSchemaReq.validate(req.body);
    if (error) {
      console.error(error);
      next(error)
    }
    const owner = req.user._id
    const { name, email, phone, favorite = false } = req.body;
    const newContact = await contacts.addContact({ name, email, phone, favorite, owner});
    res.status(201).json(newContact);
  } catch (err) {
    next(err);
  }
});

contactsRouter.delete("/:contactId", auth, async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const owner = req.user._id
    const removeContact = await contacts.removeContact(contactId, owner);
    if (!removeContact) {
      res.status(404).json({
        status: '404 found',
        code: 404,
        message: 'Not Found',
      });
      next()
    }
    res.json({ message: "Delete success" });
  } catch (err) {
    next(err);
  }
});

contactsRouter.put("/:contactId", auth, async (req, res, next) => {
  try {
    const owner = req.user._id
    if (Object.keys(req.body).length < 1) {
      return res.status(400).json({ message: "missing fields" });
    }

    const { error, value } = addSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ message: "Validation error", details: error.details });
    }

    const { contactId } = req.params;
    const updateContactId = await contacts.updateContact(contactId, req.body, owner);
    res.json(updateContactId);
  } catch (err) {
    res.status(404).json({
      status: '404 found',
      code: 404,
      message: 'Not Found',
    });
    next();
  }
});

contactsRouter.patch("/:contactId/favorite", auth, async (req, res, next) => {
  try {
    const owner = req.user._id
    if (Object.keys(req.body).length < 1) {
      return res.status(400).json({ message: "missing fields" });
    }

    const { error, value } = addSchemaFavorite.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ message: "Validation error", details: error.details });
    }

    const { contactId } = req.params;
    const updateContactId = await contacts.updateContact(contactId, req.body, owner);
    res.json(updateContactId);
  } catch (err) {
    res.status(404).json({
      status: '404 found',
      code: 404,
      message: 'Not Found',
    });
    next();
  }
});

module.exports = contactsRouter;
