const mongoose = require("mongoose");
const { isEmail } = require("validator");
const bcrypt = require("bcrypt");
const Joi = require("joi");
const jwt = require("jsonwebtoken");

const studentSchema = new mongoose.Schema({
  // TE roll number
  rollNumber: {
    type: Number,
    required: true,
    unique: true,
    maxlength: 5,
  },
  teSection: {
    type: Number,
  },
  firstName: {
    type: String,
    required: true,
  },
  middleName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    validate: [isEmail, "Please Enter a Valid Email"],
  },
  alternateEmail: {
    type: String,
    required: true,
    validate: [isEmail, "Please Enter a Valid Email"],
  },
  phone: {
    type: Number,
    required: true,
    unique: true,
  },
  alternatePhone: {
    type: Number,
    required: true,
  },
  dob: {
    type: Date,
    required: true,
  },
  gender: {
    type: String,
    required: true,
  },
  currentAddress: {
    type: String,
    required: true,
  },
  permanentAddress: {
    type: String,
    required: true,
  },
  branch: {
    type: String,
    required: true,
  },
  // college registration number
  pictRegistrationId: {
    type: String,
    required: true,
    lowercase: true,
    unique: true,
  },
  // university Permanent Registration number
  prn: {
    type: String,
    required: true,
    tolower: true,
    unique: true,
  },

  // SSC details
  // percentage
  sscPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  sscBoard: {
    type: String,
    required: true,
    tolower: true,
  },
  yearOFPassingSsc: {
    type: Number,
    required: true,
  },
  gapAfterSsc: {
    type: Number,
    required: true,
  },
  reasonOfGapSsc: {
    type: String,
  },

  isHsc: {
    type: Boolean,
    requied: true,
  },

  isDiploma: {
    type: Boolean,
    requied: true,
  },

  isBoth: {
    type: Boolean,
    requied: true,
  },

  // HSC details
  // percentage in 12th
  hscPercentage: {
    type: Number,
    min: -1,
    max: 100,
  },
  hscBoard: {
    type: String,
  },
  yearOFPassingHsc: {
    type: Number,
  },
  gapAfterHsc: {
    type: Number,
  },
  reasonOfGapHsc: {
    type: String,
  },
  // Diploma details

  // percentage
  diplomaPercentage: {
    type: Number,
    min: -1,
    max: 100,
  },
  diplomaUniversity: {
    type: String,
  },
  yearOfPassingDipoma: {
    type: Number,
  },
  gapAfterDiploma: {
    type: Number,
  },
  reasonForGapDiploma: {
    type: String,
  },

  // collage  details

  yearOfStartingCollege: {
    type: Number,
    required: true,
  },
  firstYearFirstSemCgpa: {
    type: Number,
    required: true,
    max: 10,
  },
  firstYearSecondSemCgpa: {
    type: Number,
    required: true,
    max: 10,
  },
  secondYearfirstSemCgpa: {
    type: Number,
    required: true,
    max: 10,
  },
  secondYearSecondSemCgpa: {
    required: true,
    type: Number,
    max: 10,
  },
  thirdYearFirstSemCgpa: {
    type: Number,
    required: true,
    max: 10,
  },
  activeBacklog: {
    type: Number,
    required: true,
  },
  passiveBacklog: {
    type: Number,
    required: true,
  },
  //  candidate a year down
  yearDrop: {
    type: String,
    required: true,
  },
  // aadhar card details
  aadharCard: {
    type: Number,
    unique: true,
    required: true,
  },
  // panCard
  panCard: {
    type: String,
    required: true,
  },
  passportCard: {
    type: String,
    required: true,
  },
  citizenship: {
    type: String,
    required: true,
  },
  planningForHigherEducation: {
    type: String,
    required: true,
  },
  // Amcat details
  appearedForAmcat: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 7,
  },
  isLTE20: {
    type: Boolean,
    default: false,
  },
  isGT20: {
    type: Boolean,
    default: false,
  },
  appliedCompanies: [
    {
      companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
      },
      name: {
        type: String,
        required: true,
      },
      totalRounds: {
        type: Number,
        required: true,
      },
      roundCleared: {
        type: Number,
        default: 0,
      },
      result: {
        type: Boolean,
        default: true,
      },
    },
  ],

  //Ug and Pg boolean
  isUg: { type: Boolean, default: true },

  //new fields :
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  resetPasswordTokenForForgotPassword: String,
});

studentSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

studentSchema.statics.login = async function (email, password) {
  const student = await this.findOne({ email });
  if (student) {
    const auth = await bcrypt.compare(password, student.password);
    if (auth) {
      return student;
    }
    throw new Error("Incorrect Password");
  }
  throw new Error("Incorrect Email");
};

studentSchema.methods.generateAuthToken = async function () {
  try {
    let tokenGen = jwt.sign({ _id: this._id }, process.env.JWT_SECRET);
    // this.tokens = this.tokens.concat({ token : tokenGen });
    // await this.save();
    return tokenGen;
  } catch (err) {
    console.log("err in generateAuthToken", err);
  }
};

module.exports.validate = (student) => {
  const schema = Joi.object({
    rollNumber: Joi.number().required(),
    teSection: Joi.number(),
    firstName: Joi.string().required(),
    middleName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    alternateEmail: Joi.string().email().required(),
    phone: Joi.number().required(),
    alternatePhone: Joi.number().required(),
    dob: Joi.string().isoDate().required(),
    gender: Joi.string().required(),
    currentAddress: Joi.string().required(),
    permanentAddress: Joi.string().required(),
    branch: Joi.string().required(),
    pictRegistrationId: Joi.string().lowercase().required(),
    // university Permanent Registration number
    prn: Joi.string().lowercase(),

    // SSC details
    // percentage => check min and max for boundary conditions, for eg. 100
    sscPercentage: Joi.number().min(0).max(100).required(),
    sscBoard: Joi.string().lowercase().required(),
    yearOFPassingSsc: Joi.number().required(),
    gapAfterSsc: Joi.number().required(),
    reasonOfGapSsc: Joi.string(),

    isHsc: Joi.boolean().required(),
    isDiploma: Joi.boolean().required(),
    isBoth: Joi.boolean().required(),

    // HSC details
    // percentage in 12th
    hscPercentage: Joi.number().min(0).max(100),
    hscBoard: Joi.string(),
    yearOFPassingHsc: Joi.number(),
    gapAfterHsc: Joi.number(),
    reasonOfGapHsc: Joi.string(),
    // Diploma details

    // percentage
    diplomaPercentage: Joi.number().min(0).max(100),
    diplomaUniversity: Joi.string(),
    yearOfPassingDiploma: Joi.number(),
    gapAfterDiploma: Joi.number(),
    reasonForGapDiploma: Joi.string(),

    // collage  details

    yearOfStartingCollege: Joi.number().required(),
    firstYearFirstSemCgpa: Joi.number().max(10).required(),
    firstYearSecondSemCgpa: Joi.number().max(10).required(),
    secondYearfirstSemCgpa: Joi.number().max(10).required(),
    secondYearSecondSemCgpa: Joi.number().max(10).required(),
    thirdYearFirstSemCgpa: Joi.number().max(10).required(),
    activeBacklog: Joi.number().required(),
    passiveBacklog: Joi.number().required(),
    //  candidate a year down
    yearDrop: Joi.string().required(),
    // aadhar card details
    aadharCard: Joi.number().required(),
    // panCard
    panCard: Joi.string().required(),
    passportCard: Joi.string().required(),
    citizenship: Joi.string().required(),
    planningForHigherEducation: Joi.string().required(),
    // Amcat details
    appearedForAmcat: Joi.string().required(),
    password: Joi.string().required().min(7),

    isLTE20: Joi.boolean(),
    isGT20: Joi.boolean(),
  });

  return schema.validate(student);
};

const Student = mongoose.model("Student", studentSchema);

module.exports = Student;
