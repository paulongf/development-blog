import { IKImage } from "imagekitio-react";

const Image = ({ path, className, w, h, alt }) => {
  // remove a parte do URL se for uma URL completa
  const cleanPath = path?.replace("https://ik.imagekit.io/ghabpm6we/", "");

  return (
    <IKImage
      urlEndpoint={import.meta.env.VITE_IK_URL_ENDPOINT}
      path={cleanPath}
      className={className}
      loading="lazy"
      lqip={{ active: true, quality: 20 }}
      alt={alt}
      width={w}
      height={h}
      transformation={[
        {
          width: w,
          height: h,
        },
      ]}
    />
  );
};

export default Image;
