const express = require("express");
require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");
const path = require("path");
const https = require("https");
const multer = require("multer");

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only JPG, PNG and WEBP images are allowed"));
        }

    }
});

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
// =========================
// REAL OTP - 2FACTOR
// =========================

// =========================
// REAL OTP - 2FACTOR
// =========================

const otpSessions = new Map();


// =========================
// SEND OTP
// =========================

app.post("/api/send-otp", async (req, res) => {

    try {

        const mobile =
            String(req.body.mobile || "").trim();


        if (!/^[6-9]\d{9}$/.test(mobile)) {

            return res.status(400).json({
                error: "Invalid mobile number"
            });

        }
        console.log("CURRENT OTP MODE:", otpMode);
        if (otpMode === "fixed") {

    const fixedOtp =
        String(process.env.FIXED_OTP || "");

    if (!/^\d{6}$/.test(fixedOtp)) {

        return res.status(500).json({
            error: "Fixed OTP is not configured"
        });

    }

    otpSessions.set(mobile, {
        otp: fixedOtp,
        createdAt: Date.now()
    });

    console.log(
        "Fixed OTP generated for:",
        mobile
    );

    return res.json({
        success: true,
        message: "OTP generated successfully"
    });
}


        const apiKey =
            process.env.TWO_FACTOR_API_KEY;


        if (!apiKey) {

            return res.status(500).json({
                error: "OTP service is not configured"
            });

        }


        // Generate a new 6-digit OTP
        const otp =
            Math.floor(
                100000 +
                Math.random() * 900000
            ).toString();


        // Send OTP through 2Factor
        const response =
            await fetch(
                `https://2factor.in/API/V1/${apiKey}/SMS/${mobile}/${otp}`,
                {
                    method: "POST"
                }
            );


        const rawResponse =
            await response.text();


        console.log(
            "2Factor HTTP status:",
            response.status
        );

        console.log(
            "2Factor response:",
            rawResponse
        );


        let result = null;

        try {
            result = JSON.parse(rawResponse);
        } catch {
            result = null;
        }


        // Save OTP for verification
        if (
            response.ok &&
            (
                !result ||
                result.Status === "Success"
            )
        ) {

            otpSessions.set(mobile, {

                otp: otp,

                createdAt:
                    Date.now()

            });


            return res.json({

                success: true,

                message:
                    "OTP sent successfully"

            });

        }


        return res.status(500).json({

            error:
                result?.Details ||
                "Could not send OTP"

        });


    } catch (err) {

        console.error(
            "Send OTP error:",
            err
        );


        return res.status(500).json({

            error:
                "OTP service error"

        });

    }

});


// =========================
// VERIFY OTP
// =========================

app.post("/api/verify-otp", async (req, res) => {

    try {

        const mobile =
            String(req.body.mobile || "").trim();


        const otp =
            String(req.body.otp || "").trim();


        if (
            !/^[6-9]\d{9}$/.test(mobile) ||
            !/^\d{6}$/.test(otp)
        ) {

            return res.status(400).json({

                error:
                    "Invalid mobile number or OTP"

            });

        }


        const session =
            otpSessions.get(mobile);


        if (!session) {

            return res.status(400).json({

                error:
                    "OTP not found or expired"

            });

        }


        // OTP valid for 5 minutes
        if (
            Date.now() -
            session.createdAt >
            5 * 60 * 1000
        ) {

            otpSessions.delete(mobile);


            return res.status(400).json({

                error:
                    "OTP expired. Please request a new OTP."

            });

        }


        if (otp !== session.otp) {

            return res.status(400).json({

                error:
                    "Invalid OTP"

            });

        }


        // OTP verified successfully
        otpSessions.delete(mobile);


        return res.json({

            success: true,

            verified: true

        });


    } catch (err) {

        console.error(
            "Verify OTP error:",
            err
        );


        return res.status(500).json({

            error:
                "OTP verification error"

        });

    }

});
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const ADMIN_PIN = process.env.ADMIN_PIN;
let otpMode = "2factor";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// =========================
// ADMIN SESSIONS
// =========================

const sessions = new Map();

function auth(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");

  if (!token || !sessions.has(token)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
}

// =========================
// CREATE COMPLAINT
// =========================

app.post(
    "/api/complaints",
    upload.single("complaintPhoto"),
    async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const phone = String(req.body.phone || req.body.mobile || "").trim();
    const category = String(
      req.body.category || req.body.type || ""
    ).trim();

    const location = String(
  req.body.location ||
  req.body.area ||
  req.body.address ||
  ""
).trim();

    const description = String(
      req.body.description || req.body.descreption || ""
    ).trim();

    const latitude =
      req.body.latitude !== undefined &&
      req.body.latitude !== null &&
      req.body.latitude !== ""
        ? Number(req.body.latitude)
        : null;

    const longitude =
      req.body.longitude !== undefined &&
      req.body.longitude !== null &&
      req.body.longitude !== ""
        ? Number(req.body.longitude)
        : null;
        // Upload complaint photo to Supabase Storage
let photoUrl = null;

if (req.file) {
    const fileExtension =
        req.file.originalname
            .split(".")
            .pop()
            .toLowerCase();

    const fileName =
        `complaint-${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${fileExtension}`;

    const { error: uploadError } =
        await supabase.storage
            .from("complaint-photos")
            .upload(
                fileName,
                req.file.buffer,
                {
                    contentType: req.file.mimetype,
                    upsert: false
                }
            );

    if (uploadError) {
        console.error(
            "Photo upload failed:",
            uploadError.message
        );

        return res.status(500).json({
            error: "Could not upload complaint photo"
        });
    }

    const {
        data: publicUrlData
    } =
        supabase.storage
            .from("complaint-photos")
            .getPublicUrl(fileName);

    photoUrl =
        publicUrlData.publicUrl;
        console.log("PHOTO URL:", photoUrl);
}

    // Validation
    if (
      !name ||
      !/^\d{10}$/.test(phone) ||
      !category ||
      !location ||
      !description ||
      description.length < 10
    ) {
      return res.status(400).json({
        error: "Invalid complaint data"
      });
    }

    // Insert complaint.
    // complaint_id is generated by Supabase/database.
    const { data, error } = await supabase
      .from("complaints")
      .insert({
        name,
        phone,
        category,
        description,
        location,
        latitude:
          Number.isFinite(latitude) ? latitude : null,
        longitude:
          Number.isFinite(longitude) ? longitude : null,
        status: "Submitted",
        image_url: photoUrl
      })
      .select("complaint_id,created_at")
      .single();

    if (error) {
      console.error(
        "Complaint insert failed:",
        error.message
      );

      return res.status(500).json({
        error: "Could not save complaint"
      });
    }

    return res.json({
      id: data.complaint_id,
      created: data.created_at || null
    });

  } catch (err) {
    console.error("Complaint API error:", err);

    return res.status(500).json({
      error: "Server error"
    });
  }
});

// =========================
// TRACK COMPLAINT
// =========================

app.get("/api/complaints/:id", async (req, res) => {
  try {
    const complaintId = String(req.params.id || "")
      .trim()
      .toUpperCase();

    if (!complaintId) {
      return res.status(400).json({
        error: "Complaint ID required"
      });
    }

    const { data, error } = await supabase
      .from("complaints")
      .select(
        "complaint_id,name,phone,category,description,location,latitude,longitude,status,assigned_to,image_url,created_at"
      )
      .eq("complaint_id", complaintId)
      .maybeSingle();

    if (error) {
      console.error(
        "Tracking error:",
        error.message
      );

      return res.status(500).json({
        error: "Could not fetch complaint"
      });
    }

    if (!data) {
      return res.status(404).json({
        error: "Complaint not found"
      });
    }

    return res.json({
      id: data.complaint_id,
      name: data.name,
      phone: data.phone,
      category: data.category,
      description: data.description,
      area: data.location,
      location: data.location,
      latitude: data.latitude,
      longitude: data.longitude,
      status: data.status,
      assigned_to: data.assigned_to,
      image_url: data.image_url,
      created: data.created_at
    });

  } catch (err) {
    console.error("Tracking API error:", err);

    return res.status(500).json({
      error: "Server error"
    });
  }
});

// =========================
// ADMIN LOGIN
// =========================

app.post("/api/admin/login", (req, res) => {
  const pin = String(req.body.pin || "");

  if (pin !== ADMIN_PIN) {
    return res.status(401).json({
      error: "Wrong PIN"
    });
  }

  const token = crypto
    .randomBytes(32)
    .toString("hex");

  sessions.set(token, true);

  return res.json({
    token
  });
});
// =========================
// ADMIN - OTP MODE PASSWORD
// =========================
// =========================
// ADMIN - CHANGE OTP MODE
// =========================

app.post("/api/admin/otp-mode-password", auth, (req, res) => {

    const password =
        String(req.body.password || "").trim();

    const mode =
        String(req.body.mode || "").trim();

    const correctPassword =
        String(process.env.OTP_MODE_PASSWORD || "");

    if (!correctPassword) {
        return res.status(500).json({
            error: "OTP mode password is not configured"
        });
    }

    if (password !== correctPassword) {
        return res.status(401).json({
            error: "Wrong OTP mode password"
        });
    }

    if (
        mode !== "fixed" &&
        mode !== "2factor"
    ) {
        return res.status(400).json({
            error: "Invalid OTP mode"
        });
    }

    otpMode = mode;

    console.log(
        "OTP mode changed to:",
        otpMode
    );

    return res.json({
        ok: true,
        mode: otpMode
    });

});
// =========================
// ADMIN LOGOUT
// =========================

app.post("/api/admin/logout", auth, (req, res) => {
  const token = (
    req.headers.authorization || ""
  ).replace("Bearer ", "");

  sessions.delete(token);

  return res.json({
    ok: true
  });
});

// =========================
// ADMIN - GET COMPLAINTS
// =========================

app.get("/api/admin/complaints", auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("complaints")
      .select(
        "complaint_id,name,phone,category,description,location,latitude,longitude,status,assigned_to,created_at,image_url"
      )
      .order("created_at", {
        ascending: false
      });

    if (error) {
      console.error(
        "Admin complaints error:",
        error.message
      );

      return res.status(500).json({
        error: "Could not load complaints"
      });
    }

    const complaints = (data || []).map(c => ({
      id: c.complaint_id,
      name: c.name,
      phone: c.phone,
      category: c.category,
      description: c.description,
      area: c.location,
      location: c.location,
      latitude: c.latitude,
      longitude: c.longitude,
      status: c.status,
      assigned_to: c.assigned_to,
      created: c.created_at,
      image_url: c.image_url
    }));

    return res.json(complaints);

  } catch (err) {
    console.error("Admin API error:", err);

    return res.status(500).json({
      error: "Server error"
    });
  }
});

// =========================
// ADMIN - CHANGE STATUS
// =========================

app.patch(
  "/api/admin/complaints/:id",
  auth,
  async (req, res) => {
    try {
      const allowed = [
        "Submitted",
        "Under Review",
        "Assigned",
        "In Progress",
        "Resolved"
      ];

      const status = String(
        req.body.status || ""
      );
      const assigned_to = String(
    req.body.assigned_to || ""
).trim();


      if (!allowed.includes(status)) {
        return res.status(400).json({
          error: "Invalid status"
        });
      }

      const complaintId = String(
        req.params.id || ""
      )
        .trim()
        .toUpperCase();

      const { data, error } = await supabase
        .from("complaints")
        .update({
    status,
    assigned_to
})
        .eq("complaint_id", complaintId)
        .select(
          "complaint_id,name,phone,category,description,location,latitude,longitude,status,assigned_to,created_at,image_url"
        )
        .maybeSingle();

      if (error) {
        console.error(
          "Status update failed:",
          error.message
        );

        return res.status(500).json({
          error: "Status update failed"
        });
      }

      if (!data) {
        return res.status(404).json({
          error: "Complaint not found"
        });
      }

      return res.json({
        id: data.complaint_id,
        name: data.name,
        phone: data.phone,
        category: data.category,
        description: data.description,
        area: data.location,
        location: data.location,
        latitude: data.latitude,
        longitude: data.longitude,
        status: data.status,
        assigned_to: data.assigned_to,
        created: data.created_at,
        image_url: data.image_url
      });

    } catch (err) {
      console.error(
        "Status API error:",
        err
      );

      return res.status(500).json({
        error: "Server error"
      });
    }
  }
);

// =========================
// SUPABASE CONNECTION TEST
// =========================

async function testSupabase() {
  try {
    const { error } = await supabase
      .from("complaints")
      .select("id")
      .limit(1);

    if (error) {
      console.error(
        "Supabase connection failed:",
        error.message
      );
    } else {
      console.log(
        "Supabase connected successfully!"
      );
    }
  } catch (err) {
    console.error(
      "Supabase connection failed:",
      err.message
    );
  }
}

// =========================
// FRONTEND
// =========================

app.get("*", (req, res) => {
  res.sendFile(
    path.join(
      __dirname,
      "public",
      "index.html"
    )
  );
});

// =========================
// START SERVER
// =========================

app.listen(PORT, () => {
  console.log(
    `CivicConnect running on http://localhost:${PORT}`
  );
});

testSupabase();