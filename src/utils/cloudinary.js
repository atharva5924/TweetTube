import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    //upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the upload operation got failed
    return null;
  }
};
const deleteFromCloudinary = async (url, resourceType = "image") => {
  if (!url) {
    return null;
  }

  const resourcePublicId = url.split("/").pop().split(".")[0];

  const response = await cloudinary.uploader.destroy(resourcePublicId, {
    resource_type: resourceType,
  });

  console.log("42, deleteFromCloudinaryResponse", response);
};

export { uploadOnCloudinary, deleteFromCloudinary };
