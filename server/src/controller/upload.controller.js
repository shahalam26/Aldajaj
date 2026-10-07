import cloudinary from "../config/cloudinary.js";

const uploadToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,

        resource_type: "image",

        transformation: [
          {
            width: 1200,
            height: 1200,
            crop: "limit",
            quality: "auto",
            fetch_format: "auto",
          },
        ],
      },

      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    stream.end(fileBuffer);
  });
};

const uploadProductImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one image",
      });
    }

    const uploadedImages = [];

    for (const file of req.files) {
      const result = await uploadToCloudinary(
        file.buffer,
        "dilli-cuts/products"
      );

      uploadedImages.push({
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Product images uploaded successfully",
      images: uploadedImages,
    });
  } catch (error) {
    console.error(
      "uploadProductImages error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Image upload failed",
    });
  }
};

export {
  uploadProductImages,
};