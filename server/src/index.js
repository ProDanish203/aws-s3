import express from "express";
import cors from "cors";
import morgan from "morgan";
import { config } from "dotenv";
import { connDb } from "./config/dbConn.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import multer from "multer";
import multerS3 from "multer-s3";
import crypto from "crypto";
import sharp from "sharp";
import { Post } from "./models/post.model.js";
// S3
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  CloudFrontClient,
  CreateInvalidationCommand,
} from "@aws-sdk/client-cloudfront";

config();

const getRandomFileName = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("hex");

const app = express();

const bucket_name = process.env.BUCKET_NAME;
const bucket_region = process.env.BUCKET_REGION;
const bucket_access_key = process.env.AWS_BUCKET_ACCESS_KEY_ID;
const bucket_secret_key = process.env.AWS_BUCKET_SECRET_ACCESS_KEY;
const cloudfront_distribution_id = process.env.CLOUDFRONT_DISTRIBUTION_ID;
const cloudfare_url = process.env.CLOUDFRONT_URL;

const s3Client = new S3Client({
  region: bucket_region,
  credentials: {
    accessKeyId: bucket_access_key,
    secretAccessKey: bucket_secret_key,
  },
});

const cloudFront = new CloudFrontClient({
  region: bucket_region,
  credentials: {
    accessKeyId: bucket_access_key,
    secretAccessKey: bucket_secret_key,
  },
});

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer config
// const storage = multer.memoryStorage();
// const upload = multer({ storage: storage });

const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: bucket_name,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const filename = getRandomFileName();
      cb(null, `uploads/test/${filename}-`);
    },
  }),
});

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Boilerplate API",
  });
});

app.post("/api/posts/add", upload.single("image"), async (req, res, next) => {
  try {
    const { caption } = req.body;

    // Process image for resizing and compressing
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 500, height: 800, fit: "contain" })
      .toBuffer();

    const fileName = `uploads/test/${getRandomFileName()}-${
      req.file.originalname
    }`;

    const command = new PutObjectCommand({
      Bucket: bucket_name,
      Key: fileName,
      Body: buffer,
      ContentType: req.file.mimetype,
    });

    const response = await s3Client.send(command);

    if (!response) return next("Something went wrong");

    const post = await Post.create({
      caption,
      image: fileName,
    });

    if (!post) return next("Something went wrong");

    return res.status(200).json({
      success: true,
      message: "Ok",
      data: post,
    });
  } catch (error) {
    console.log(error);
    return next("Something went wrong");
  }
});

app.post(
  "/api/posts/multer",
  upload.single("image"),
  async (req, res, next) => {
    try {
      const { caption } = req.body;

      const post = await Post.create({
        caption,
        image: req.file.key,
      });

      if (!post) return next("Something went wrong");

      return res.status(200).json({
        success: true,
        message: "Ok",
        data: post,
      });
    } catch (error) {
      console.log(error);
      return next("Something went wrong");
    }
  }
);

app.get("/api/posts", async (req, res, next) => {
  try {
    const posts = await Post.find();
    if (!posts) return next("Something went wrong");

    const postsWithUrls = await Promise.all(
      posts.map(async (post) => {
        // const command = new GetObjectCommand({
        //   Bucket: bucket_name,
        //   Key: post.image,
        // });
        // const url = await getSignedUrl(s3Client, command, { expoiresIn: 3600 });

        // Added Clodfront URL
        const url = `${cloudfare_url}${post.image}`;
        return { ...post.toObject(), imageUrl: url };
      })
    );

    return res.status(200).json({
      success: true,
      message: "Ok",
      data: postsWithUrls,
    });
  } catch (error) {
    console.log(error);
    return next("Something went wrong");
  }
});

app.delete("/api/posts/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const post = await Post.findByIdAndDelete(id);
    if (!post) return next("Something went wrong");

    const command = new DeleteObjectCommand({
      Bucket: bucket_name,
      Key: post.image,
    });

    await s3Client.send(command);

    // Invalidate the cloudfront cache for the deleted image
    const invalidationCommand = new CreateInvalidationCommand({
      DistributionId: cloudfront_distribution_id,
      InvalidationBatch: {
        CallerReference: post.image,
        Paths: {
          Quantity: 1,
          Items: [`/${post.image}`],
        },
      },
    });

    await cloudFront.send(invalidationCommand);

    return res.status(200).json({
      success: true,
      message: "Post Deleted successfully",
      data: post,
    });
  } catch (error) {
    console.log(error);
    return next("Something went wrong");
  }
});

app.use(errorMiddleware);

const port = process.env.PORT || 5000;

connDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is listening live on port:${port}`);
    });
  })
  .catch((error) => {
    console.log(`Database Connection Error: ${error}`);
  });
