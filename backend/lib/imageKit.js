import dotenv from "dotenv";
import ImageKit from "imagekit";

dotenv.config(); 

const imagekit = new ImageKit({
  urlEndpoint: process.env.IK_URL_ENDPOINT,
  publicKey: process.env.IK_PUBLIC_KEY,
  privateKey: process.env.IK_PRIVATE_KEY,
});

export default imagekit;
