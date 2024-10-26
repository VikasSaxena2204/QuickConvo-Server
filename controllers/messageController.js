const Messages = require("../models/messageModel");

const validateRequestBody = (req, res, next) => {
  const { from, to, message } = req.body;
  if (!from || !to || !message) {
    return res.status(400).json({ msg: "All fields are required." });
  }
  next();
};

module.exports.getMessages = async (req, res, next) => {
  try {
    const { from, to } = req.body;
    const messages = await Messages.find({
      users: { $all: [from, to] },
    }).sort({ updatedAt: 1 });

    const projectedMessages = messages.map((msg) => {
      return {
        fromSelf: msg.sender.toString() === from,
        message: msg.message.text,
      };
    });
    res.json(projectedMessages);
  } catch (ex) {
    console.error("Error fetching messages:", ex); 
    res.status(500).json({ msg: "Internal server error" }); 
  }
};

module.exports.addMessage = [
  validateRequestBody, 
  async (req, res, next) => {
    try {
      const { from, to, message } = req.body;
      const data = await Messages.create({
        message: { text: message },
        users: [from, to],
        sender: from,
      });

      if (data) {
        return res.status(201).json({ msg: "Message added successfully." });
      } else {
        return res.status(500).json({ msg: "Failed to add message to the database" });
      }
    } catch (ex) {
      console.error("Error adding message:", ex); // Log error for debugging
      res.status(500).json({ msg: "Internal server error" }); // Send a generic error response
    }
  },
];
