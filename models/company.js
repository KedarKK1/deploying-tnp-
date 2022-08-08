const mongoose = require("mongoose");
const { validator, isEmail, isURL } = require("validator");

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Enter the Company Name"],
  },
  ctc: {
    type: Number,
    required: [true, "Enter the CTC"],
  },
  // profile either add defualt software engineer or keep undefined
  profile: {
    type: String,
    required: [true, "Enter the Profile"],
  },
  websiteUrl: {
    type: String,
  },
  email: {
    type: String,
    required: true,
    unique: true, //as email needs to be unique
    validate: [isEmail, "Please enter a valid email"],
  },
  companyLocation: {
    type: String,
  },
  totalRounds: {
    type: Number,
    required: [true, "Total number of round is missing"],
  },
  currentRound: {
    type: Number,
    default: 0,
  },
  startDate: {
    type: Date,
    required: [true, "Enter Start date for Applying"],
  },
  endDate: {
    type: Date,
    required: [true, "Enter End date for Applying"],
  },
  criteria: {
    branch: {
      cs: { type: Boolean },
      it: { type: Boolean },
      entc: { type: Boolean },
    },
    cgpa: {
      type: Number,
    },
    // gender : 
    //hsc and ssc percentage criteria not mentioned for few companies
    // either default -> 0 (or) undefined.
    sscPercentage: {
      type: Number,
    },
    hscPercentage: {
      type: Number,
    },
    courseName: {
      ug: { type: Boolean },
      pg: { type: Boolean },
    },
  },
  skillsRequired: [],
  driveDetails: [
    {
      roundNo: {
        type: Number,
        required: [true, "Enter Round No"],
        min: 1,
      },
      activity: {
        type: String,
        required: [true, "Mention Round activity"],
      },
      date: {
        type: String,
        required: [true, "Enter the date "],
      },
      day: {
        type: String,
      },
      time: {
        type: String,
        required: [true, "Mention time for the Round"],
      },
      venue: {
        type: String,
        required: [true, "Enter the venue of Round"],
      },
    },
  ],
  appliedStudents: [
    {
      studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
      email: {
        type: String,
        required: true,
      },
      roundCleared: {
        type: Number,
        default: 0,
      },
      studentResult: {
        type: Boolean,
        default: true,
      },
    },
  ],
  // This indicate whether Drive is Ended
  result: {
    type: Boolean,
    default: false,
  },
});

const Company = mongoose.model("Company", companySchema);

module.exports = Company;
