const Student = require("../models/student");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Company = require("../models/company");
const File = require("../models/file");
const crypto = require("crypto");
const nodeMailer = require("nodemailer");
const multer = require("multer");
const fs = require("fs-extra");
const path = require("path");

let upload = multer({
  storage: multer.diskStorage({
    destination: async (req, file, cb) => {
      // ** code for making directory using company ID make sure to change schema of file.js
      let companyId = req.params.companyId;
      let company = await Company.findById(companyId);
      req.company = company;
      if (!company) {
        throw Error("Company cannot be found!");
      }
      company = company.name;
      let path = `./uploads/${company}`;
      if (!fs.existsSync(path)) {
        fs.mkdirSync(path, { recursive: true });
      }
      cb(null, path);
    },
    filename: async (req, file, cb) => {
      //  ** with student auth Code
      let studentId = req.student._id;
      console.log(studentId);
      let student = await Student.findById(studentId);
      if (!student) {
        throw Error("Student cannot be found!");
      }
      let filename = student.pictRegistrationId;
      req.filename = filename;
      cb(null, filename + path.extname(file.originalname));
    },
  }),
}).single("resume");

const handleErrors = (err) => {
  let errors = { name: "", phone: "", email: "", password: "" };

  // incorrect email
  if (err.message === "Incorrect Email") {
    errors.email = "This email is not registered";
  }

  // incorrect password
  if (err.message === "Incorrect Password") {
    errors.password = "This password is not registered";
  }

  // duplicate error code
  if (err.code === 11000) {
    errors.email = "that email existed earlier";
  }

  // validation errors
  if (err.message.includes("Student validation failed")) {
    Object.values(err.errors).forEach(({ properties }) => {
      errors[properties.path] = properties.message;
    });
  }

  return errors;
};

const tokenAge = parseInt(process.env.JWT_AGE);

// const createToken = (id) => {
//   return jwt.sign({ id }, process.env.JWT_SECRET, {
//     expiresIn: tokenAge,
//   });
// };

// login student
module.exports.login_student = async (req, res) => {
  // const { email, password } = req.body;
  // try {
  //   const student = await Student.login(email, password);
  //   const token = createToken(student._id);
  //   res.cookie("token", token, { httpOnly: true, maxAge: tokenAge * 1000 });
  //   res.cookie("usertype", "student", { httpOnly: true, maxAge: tokenAge * 1000 });
  //   res.status(200).send({ student, success: true });
  // } catch (err) {
  //   const errors = handleErrors(err);
  //   res.status(400).json({ errors, success: false });
  // }
  const { email, password } = req.body;
  try {
    let token;
    // const student = await Student.login(email, password);
    const student = await Student.findOne({ email: email });
    if (student) {
      const isMatch = await bcrypt.compare(password, student.password);
      // token = createToken(student._id);
      token = await student.generateAuthToken();
      const usertype = "student";
      if (isMatch) {
        res.cookie("token", token, {
          httpOnly: true,
          maxAge: tokenAge * 1000,
          expires: new Date(Date.now() + 2483000000),
        }); //30 days expiry
        // res.cookie("usertype", "student", {
        //   httpOnly: true,
        //   maxAge: tokenAge * 1000,
        //   expires: new Date(Date.now() + 2483000000),
        // });
        res.status(200).send({ student, token, success: true });
      } else {
        res.status(400).json({ error: "invalid creds" });
      }
    } else {
      res.status(400).json({ error: "invalid creds" });
    }
  } catch (err) {
    const errors = handleErrors(err);
    res.status(400).json({ errors, success: false });
  }
};

// logout student
module.exports.logout_student = (req, res) => {
  req.student._id = "";
  res.cookie("token", "", { maxAge: 1 });
  res.cookie("usertype", "", { maxAge: 1 });
  res.send({ success: true, message: "Student Logged Out." });
};

// student profile
module.exports.student_profile = async (req, res) => {
  try {
    const student = await Student.findById(req.student._id);
    res.status(200).json({ student, success: true });
  } catch {
    res.status(400).json({ success: false, message: "Login or Signup" });
  }
};

module.exports.drive_compaines = async (req, res) => {
  try {
    const date = new Date().toISOString();
    const companyList = await Company.find();
    // const companyList = await Company.find({
    //   $and: [{ startDate: { $lte: date } }, { endDate: { $gte: date } }],
    // });
    // const companyList = await Company.find({ driveEnd: { $eq: false } });
    res.status(200).json({
      success: true,
      message: "current companies drive",
      data: companyList,
    });
  } catch (error) {
    res
      .status(400)
      .json({ success: false, message: "Error while get company list" });
  }
};

module.exports.apply_company = async (req, res) => {
  try {
    // studentApplyForCompanies later - companyid take from req.body._id
    const company = await Company.findById(req.body.companyId);
    if (!company) {
      return res
        .status(403)
        .json({ success: false, message: "No such Company exist" });
    }

    // finding if student already exists in company's appliedStudents array
    const studentExists = await Company.findOne({
      $and: [
        { _id: req.body.companyId },
        { "appliedStudents.studentId": req.student._id },
      ],
    });

    if (studentExists) {
      return res.status(400).json({
        success: false,
        message: "You are already applied to this company",
      });
    }

    // let frontend handle the gte 20 c.t.c. part

    // currentRound and finalResult are by default stored 0 and false in db
    const student = await Student.findById(req.student._id);

    //get the student branch:
    const studentBranch = student.branch;
    const csApplicable = company.criteria.branch.cs;
    const itApplicable = company.criteria.branch.it;
    const entcApplicable = company.criteria.branch.entc;

    console.log("branch of student:", studentBranch);
    console.log("branches", csApplicable, itApplicable, entcApplicable);

    let canApply = false;
    // let myArray = [];

    if (studentBranch === "cs") {
      console.log("Student branch is cs!");
      if (csApplicable) {
        canApply = true;
      }
    } else if (studentBranch === "it") {
      console.log("Student branch is it!");
      if (itApplicable) {
        canApply = true;
      }
    } else if (studentBranch === "entc") {
      console.log("Student branch is entc!");
      if (entcApplicable) {
        canApply = true;
      }
    }
    console.log("canapply after branch cheking", canApply);

    //Course for student - either Ug or Pg:
    const companyCriteriaCourse = company.criteria.courseName.ug;
    const studentCourse = student.isUg;

    console.log("companyCriteriaCourse", companyCriteriaCourse);
    console.log("studentCourse", studentCourse);

    if (companyCriteriaCourse !== studentCourse) {
      canApply = false;
    }
    console.log("canapply after course cheking", canApply);

    //gender criteria:
    const studentGender = student.gender;
    console.log("company.criteria.sscPercentage");
    const maleApplicable = company.criteria.gender.male;
    const femaleApplicable = company.criteria.gender.female;
    const bothApplicable = company.criteria.gender.both;

    console.log("student gender", studentGender);
    console.log(
      "genders applicable:",
      maleApplicable,
      femaleApplicable,
      bothApplicable
    );

    if (!bothApplicable) {
      if (studentGender === "female") {
        if (!femaleApplicable) {
          canApply = false;
        }
      } else if (studentGender === "male") {
        if (!maleApplicable) {
          canApply = false;
        }
      }
    }
    console.log("canapply after gender cheking", canApply);

    //get the student's hsc and ssc:
    const studentSscPercentage = student.sscPercentage;

    if (studentSscPercentage < company.criteria.sscPercentage) {
      console.log(
        "ssc per:",
        studentSscPercentage,
        " ",
        company.criteria.sscPercentage
      );
      canApply = false;
    }
    console.log("canapply after ssc cheking", canApply);

    //END DATE CRITERIA:
    //checking the End Date:

    var today = new Date();
    var todaysDate =
      today.getFullYear() +
      "-" +
      (today.getMonth() + 1) +
      "-" +
      today.getDate();

    let companyEndDate = company.endDate;
    let formattedCompanyEndDate = companyEndDate.toISOString().split("T")[0];
    console.log("Todays date is:", todaysDate);
    console.log("Companys end date is:", formattedCompanyEndDate);

    /**
     * todo : Check Date Criteria
     */
    if (formattedCompanyEndDate > todaysDate) {
      canApply = false;
    }
    console.log("canApply after end-date checking:", canApply);

    //get the student's hsc and ssc:
    // const studentSscPercentage = student.SscPercentage;

    //Checking Amcat Criteria:
    if (company.criteria.RequiredAmcatScore > student.AmcatScore) {
      canApply = false;
    }
    console.log("canApply after AMCAT checking:", canApply);

    if (company.criteria.RequiredAttendance > student.attendance) {
      canApply = false;
    }
    console.log("canApply after attendance checking:", canApply);

    if (company.criteria.engCgpa > student.aggrCgpa) {
      canApply = false;
    }
    console.log("canApply after aggr.CGPA checking:", canApply);

    const status = !canApply ? 403 : 200;
    console.log("Final status cheking", status);

    if (status === 200) {
      student.appliedCompanies.push({
        companyId: company._id,
        name: company.name,
        totalRounds: company.totalRounds,
      });
      company.appliedStudents.push({
        studentId: student._id,
        studentName: `${student.firstName} ${student.middleName} ${student.lastName}`,
        studentEmail: student.email,
      });
    }

    // not used {validateBeforeSave:false}
    await company.save();
    await student.save();
    // here sending company.appliedStudents only for testing
    return res.status(status).json({
      success: true,
      message:
        status === 200
          ? "You have succesfully applied to this company"
          : "You cannot apply to this company",
      status: status,
    });
  } catch (err) {
    return res.send(err);
  }
};

// student reset Password
module.exports.student_reset_password = async (req, res) => {
  //passing in query not in params
  console.log("query", req.query);
  // console.log()

  const student = await Student.findOne({ _id: req.query.id });
  const isValid = await bcrypt.compare(
    req.query.token,
    student.resetPasswordToken
  );

  console.log("isValid", isValid);

  if (!isValid) {
    return res.status(400).json({
      success: false,
      msg: "Reset password token is invalid or has been expired",
    });
  }

  student.password = req.body.newPassword;
  student.resetPasswordToken = undefined;
  student.resetPasswordExpire = undefined;

  await student.save();

  //JWT_SECRET is a string -> parse it to integer
  const token = jwt.sign({ id: student._id }, process.env.JWT_SECRET, {
    expiresIn: parseInt(process.env.UPDATE_PASSWORD_AGE),
  });

  // option for cookie
  const options = {
    expires: new Date(
      Date.now() + parseInt(process.env.UPDATE_PASSWORD_AGE) * 1000 //1000 for milliseconds
    ),
    httpOnly: true,
  };

  res.status(200).cookie("token", token, options).json({
    success: true,
    student,
    token,
  });
};

module.exports.student_forgot_password = async (req, res) => {
  const student = await Student.findOne({ email: req.body.email });

  if (!student) {
    return res.status(404).send("student not found");
  }

  // generating token
  const resetToken = crypto.randomBytes(32).toString("hex");

  //generates salt
  const salt = await bcrypt.genSalt(8);

  const resetPasswordToken = await bcrypt.hash(resetToken, salt);

  //storing HASHED password in student db, not token
  student.resetPasswordToken = resetPasswordToken;

  student.resetPasswordExpire = Date.now() + 15 * 60 * 1000; //15 minutes from now

  await student.save({ validateBeforeSave: false });
  // console.log('student after saving', student);
  // console.log("resetToken", resetToken);
  // now send email
  // const resetPasswordUrl = `${req.protocol}://${req.get("host")}/resetPassword?token=${resetToken}&id=${user._id}`;
  const resetPasswordUrl = `http://localhost:3000/student/password/reset/${resetToken}/${student.id}`;

  // const message = `Your reset password token is:- \n\n <form action=${resetPasswordUrl} method="post">
  //     <input type="text" name="newPassword2" placeholder="Enter New password" />
  // <button type="submit">Click</button></form> \n\n If you have not requested this mail then please contact PICT TnP cell`;

  const message = `Your reset password token is:- \n\n <a href=${resetPasswordUrl}>click here</a> \n\n If you have not reque`;

  const transporter = nodeMailer.createTransport({
    service: process.env.SMTP_SERVICE,
    auth: {
      user: process.env.SMTP_MAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  try {
    let info = await transporter.sendMail(
      {
        from: process.env.SMTP_SERVICE,
        to: student.email,
        subject: "Password Recovery checking 1",
        // text: message,
        html: message,
      },
      function (err, info) {
        if (err) throw err;
        console.log(
          "response:",
          info.response,
          " Message sent: %s",
          info.messageId
        );
        // 250 Requested mail action okay, completed
        res.status(250).json({
          success: true,
          message: `Email send to ${student.email} successfully`,
        });
      }
    );

    // res.status(200).json({
    //   success: true,
    //   message: `Email send to ${student.email} successfully`,
    // });

    // console.log("Message sent: %s", info.messageId);
  } catch (error) {
    student.resetPasswordToken = undefined;
    student.resetPasswordToken = undefined;
    await student.save({ validateBeforeSave: false });
    console.log("error in student forgot pass", error);
  }
};

// student reset Password
module.exports.student_update_password = async (req, res) => {
  const student = await Student.findById(req.student._id);

  const isPasswordMatched = await bcrypt.compare(
    req.body.oldPassword,
    student.password
  );

  if (!isPasswordMatched) {
    return res.status(403).send("Passwords do not match");
  }

  // frontend compare newpassword with confirm password

  student.password = req.body.newPassword;

  await student.save();

  res.status(200).json({ success: true, message: "Password Updated." });
};

module.exports.resume_upload = async (req, res) => {
  upload(req, res, async () => {
    try {
      const file = await File.create({
        student_id: req.student._id,
        company_id: req.params.companyId,
        file_path: `./uploads/${req.company.name}/${req.filename}.pdf`,
      });
      console.log(file);
      res.status(201).json({ message: "Resume uploaded Successfully" });
    } catch (err) {
      res.status(400).json({ message: err.message });
      // ** code for resume-upload using student authentication middleware
      if (fs.existsSync(`./uploads/${req.company.name}/${req.filename}.pdf`)) {
        fs.unlink(`./uploads/${req.params.companyId}/${req.filename}.pdf`);
      }
    }
  });
};

module.exports.company_detials = async (req, res) => {
  try {
    const company = await Company.findById(req.params.companyId);
    if (!company) {
      return res
        .status(400)
        .json({ success: false, message: "Company Not Found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Company Found", data: company });
  } catch (err) {
    res.status(400).json({ errors: err, success: false });
  }
};
