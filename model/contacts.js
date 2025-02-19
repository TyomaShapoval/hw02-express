const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const contacts = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Set name for contact'],
    },
    email: {
      type: String,
    },
    phone: {
      type: String,
    },
    favorite: {
      type: Boolean,
      default: false,
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'users',
      },
  }, 
  { versionKey: false }
);

const Contacts = mongoose.model("contacts", contacts);

const listContacts = async (owner) => {
  return Contacts.find({owner});
};

const getContactById = async (id, owner) => {
  return Contacts.findOne({ _id: id, owner });
};

const removeContact = async (id, owner) => {
    return Contacts.findOneAndDelete({ _id: id, owner: owner })
};

const addContact = async (body) => {
  return Contacts.create(body);
};

const updateContact = async (id, body, owner) => {
  return Contacts.findOneAndUpdate({ _id: id, owner: owner }, body, { new: true });
};

const patchContact = async (id, body, owner) => {
  return Contacts.findOneAndUpdate({ _id: id, owner: owner }, body, { new: true });
};

module.exports = {
  listContacts,
  getContactById,
  removeContact,
  addContact,
  updateContact,
  patchContact,
};
