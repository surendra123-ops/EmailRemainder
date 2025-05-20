const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({    
    email: {
        type: String,
        required: true,
        trim: true,
      
    },
    message: {
        type: String,
        required: true
    },
    scheduledTime: {
        type: Date,
        required: true
    },
    sent: {
        type: Boolean,
        default: false
    }
});

const Reminder = mongoose.model('Reminder', reminderSchema);

module.exports = Reminder;
