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
