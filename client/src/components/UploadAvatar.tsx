// UploadAvatar.tsx
import React, { useRef } from "react";
import './UploadAvatar.css';

interface UploadAvatarProps {
  onPhotoSelected: (file: File | null) => void;
}

const UploadAvatar: React.FC<UploadAvatarProps> = ({ onPhotoSelected }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onPhotoSelected(file);
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        style={{ display: "none" }}
        onChange={handleSelect}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          cursor: "pointer",
        }}
        onClick={() => fileInputRef.current?.click()}
      />
    </>
  );
};

export default UploadAvatar;
