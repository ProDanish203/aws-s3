# S3 Notes

## Getting Started

- Create a private S3 Bucket
- Create a user that can access bucket with a policy:

```
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "VisualEditor0",
      "Effect": "Allow",
      "Action": [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject"
        ],
        "Resource": "arn:aws:s3:::unique-bucket-name/*"
    }
  ]
}

```

- Assign the policy to the created user
- Create the API Access and Secret Key

## Configuration - NodeJs

### Installing the required packages:

```
npm i @aws-sdk/client-s3
```

```
npm i @aws-sdk/s3-request-presigner
```

### Configuring the bucket

```
const s3Client = new S3Client({
  region: bucket_region,
  credentials: {
    accessKeyId: bucket_access_key,
    secretAccessKey: bucket_secret_key,
  },
});
```

### Setting Up Multer

```
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
```

### Storing files on bucket (POST)

```
  const fileName = `uploads/test/${getRandomFileName()}-${req.file.originalname}`;

  const command = new PutObjectCommand({
    Bucket: bucket_name,
    Key: fileName,
    Body: req.file.buffer,
    ContentType: req.file.mimetype,
  });

  const response = await s3Client.send(command);
```

### Getting the stored objects (GET)

```
const command = new GetObjectCommand({
  Bucket: bucket_name,
  Key: object_key,
});
const url = await getSignedUrl(s3Client, command, { expoiresIn: 3600 });
```

### Deleting the object (DELETE)

```
const command = new DeleteObjectCommand({
  Bucket: bucket_name,
  Key: object_key,
});

await s3Client.send(command);
```


# CloudFront

CloudFront is AWS's content delivery network (CDN) that securely delivers data, videos, applications, and APIs globally with low latency and high transfer speeds.

## How it works

1. **Content Distribution:** CloudFront caches your content at edge locations worldwide.

2. **User Request:** When a user requests content, they're directed to the nearest edge location.

3. **Cache Check:** If the content is in the edge location's cache, it's served immediately.

4. **Origin Fetch:** If not cached, CloudFront retrieves it from the origin server (e.g., S3 bucket) and caches it for future requests.

## Why use CloudFront

1. **Improved Performance:** Reduces latency by serving content from locations closer to users.

2. **Scalability:** Handles traffic spikes without overloading your origin server.

3. **Cost Efficiency:** Reduces the load on your origin servers, potentially lowering costs.

4. **Security:** Provides SSL/TLS encryption and integrates with AWS Shield for DDoS protection.

5. **Global Reach:** Enables you to serve content quickly to users worldwide.

6. **Customization:** Allows you to set cache behaviors, restrict access, and customize content delivery.

CloudFront is particularly useful for websites and applications with a global audience, or those needing to deliver large

## Configuring the Cloudfront - NodeJs

### Install dependencies
```
npm i @aws-sdk/client-cloudfront
```

```
const cloudFront = new CloudFrontClient({
  region: bucket_region,
  credentials: {
    accessKeyId: bucket_access_key,
    secretAccessKey: bucket_secret_key,
  },
});
```

### The url will now become:
```
const url = `${cloudfare_url}${object_name}`;
```

### Revalidate the cache after deleting the object from a bucket:
```
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
```

# Using Multer S3

```
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
```

## Usage 
```
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
```